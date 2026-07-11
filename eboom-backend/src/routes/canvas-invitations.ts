import express, { Request, Response } from "express";
import { and, desc, eq, inArray, ne, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/client";
import {
  canvasInvitations,
  canvasMembers,
  canvases,
  roles,
  users,
} from "../db/schema";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";
import {
  getCanvasMembership,
} from "../services/canvasAccessService";

const router = express.Router();

const inviteeUsers = alias(users, "invitee_users");

function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

async function markExpiredIfNeeded(invitation: typeof canvasInvitations.$inferSelect) {
  if (invitation.status === "pending" && isExpired(invitation.expiresAt)) {
    const [updated] = await db
      .update(canvasInvitations)
      .set({ status: "expired", lastModifiedAt: new Date() })
      .where(eq(canvasInvitations.id, invitation.id))
      .returning();
    return updated;
  }
  return invitation;
}

type InvitationRow = {
  invitation: typeof canvasInvitations.$inferSelect;
  canvas: typeof canvases.$inferSelect;
  role: typeof roles.$inferSelect;
  inviter: typeof users.$inferSelect;
  invitee: typeof users.$inferSelect;
};

async function formatInvitation(row: InvitationRow) {
  const invitation = await markExpiredIfNeeded(row.invitation);
  return {
    id: invitation.id,
    status: invitation.status,
    roleName: row.role.name,
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    respondedAt: invitation.respondedAt,
    canvas: {
      id: row.canvas.id,
      name: row.canvas.name,
      description: row.canvas.description,
      photoUrl: row.canvas.photoUrl,
    },
    inviter: {
      id: row.inviter.id,
      email: row.inviter.email,
      firstName: row.inviter.firstName,
      lastName: row.inviter.lastName,
      photoUrl: row.inviter.photoUrl,
    },
    invitee: {
      id: row.invitee.id,
      email: row.invitee.email,
      firstName: row.invitee.firstName,
      lastName: row.invitee.lastName,
      photoUrl: row.invitee.photoUrl,
    },
  };
}

async function fetchInvitationRows(whereClause: SQL) {
  return db
    .select({
      invitation: canvasInvitations,
      canvas: canvases,
      role: roles,
      inviter: users,
      invitee: inviteeUsers,
    })
    .from(canvasInvitations)
    .innerJoin(canvases, eq(canvasInvitations.canvasId, canvases.id))
    .innerJoin(roles, eq(canvasInvitations.roleId, roles.id))
    .innerJoin(users, eq(canvasInvitations.invitedBy, users.id))
    .innerJoin(inviteeUsers, eq(canvasInvitations.inviteeUserId, inviteeUsers.id))
    .where(whereClause)
    .orderBy(desc(canvasInvitations.createdAt));
}

router.get("/sent/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  try {
    const rows = await fetchInvitationRows(eq(canvasInvitations.invitedBy, user.id));
    const invitations = await Promise.all(rows.map(formatInvitation));
    res.json({ invitations });
  } catch (err) {
    console.error("Error fetching sent invitations:", err);
    sendError(res, ErrorKeys.invitation.fetchFailed, 500);
  }
});

router.get("/received/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  try {
    const rows = await fetchInvitationRows(
      and(
        eq(canvasInvitations.inviteeUserId, user.id),
        ne(canvasInvitations.status, "cancelled")
      )!
    );
    const invitations = await Promise.all(rows.map(formatInvitation));
    res.json({ invitations });
  } catch (err) {
    console.error("Error fetching received invitations:", err);
    sendError(res, ErrorKeys.invitation.fetchFailed, 500);
  }
});

router.post("/:id/accept/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return sendError(res, ErrorKeys.invitation.invalidId, 400);
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return sendError(res, ErrorKeys.invitation.notFound, 404);
    if (invitation.inviteeUserId !== user.id) {
      return sendError(res, ErrorKeys.common.forbidden, 403);
    }

    const current = await markExpiredIfNeeded(invitation);
    if (current.status !== "pending") {
      return sendError(res, ErrorKeys.invitation.invalidStatus, 400);
    }
    if (isExpired(current.expiresAt)) {
      return sendError(res, ErrorKeys.invitation.expired, 403);
    }

    const [canvas] = await db
      .select()
      .from(canvases)
      .where(eq(canvases.id, current.canvasId));

    if (!canvas || canvas.isArchived) {
      return sendError(res, ErrorKeys.invitation.canvasUnavailable, 403);
    }

    const [existingMember] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, current.canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    if (existingMember) {
      return sendError(res, ErrorKeys.invitation.alreadyMember, 400);
    }

    await db.insert(canvasMembers).values({
      canvasId: current.canvasId,
      userId: user.id,
      roleId: current.roleId,
      isOwner: false,
    });

    await db
      .update(canvasInvitations)
      .set({
        status: "accepted",
        respondedAt: new Date(),
        lastModifiedAt: new Date(),
      })
      .where(eq(canvasInvitations.id, invitationId));

    res.json({ message: "Invitation accepted" });
  } catch (err) {
    console.error("Error accepting invitation:", err);
    sendError(res, ErrorKeys.invitation.acceptFailed, 500);
  }
});

router.post("/:id/decline/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return sendError(res, ErrorKeys.invitation.invalidId, 400);
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return sendError(res, ErrorKeys.invitation.notFound, 404);
    if (invitation.inviteeUserId !== user.id) {
      return sendError(res, ErrorKeys.common.forbidden, 403);
    }
    if (invitation.status !== "pending") {
      return sendError(res, ErrorKeys.invitation.invalidStatus, 400);
    }

    await db
      .update(canvasInvitations)
      .set({
        status: "declined",
        respondedAt: new Date(),
        lastModifiedAt: new Date(),
      })
      .where(eq(canvasInvitations.id, invitationId));

    res.json({ message: "Invitation declined" });
  } catch (err) {
    console.error("Error declining invitation:", err);
    sendError(res, ErrorKeys.invitation.declineFailed, 500);
  }
});

router.delete("/:id/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return sendError(res, ErrorKeys.invitation.invalidId, 400);
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return sendError(res, ErrorKeys.invitation.notFound, 404);
    if (invitation.status !== "pending") {
      return sendError(res, ErrorKeys.invitation.invalidStatus, 400);
    }

    const isInviter = invitation.invitedBy === user.id;
    const membership = await getCanvasMembership(invitation.canvasId, user.id);
    const canManage =
      membership &&
      (membership.isOwner || membership.permissions.manage_members);

    if (!isInviter && !canManage) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    await db
      .update(canvasInvitations)
      .set({
        status: "cancelled",
        respondedAt: new Date(),
        lastModifiedAt: new Date(),
      })
      .where(eq(canvasInvitations.id, invitationId));

    res.json({ message: "Invitation cancelled" });
  } catch (err) {
    console.error("Error cancelling invitation:", err);
    sendError(res, ErrorKeys.invitation.cancelFailed, 500);
  }
});

export default router;
