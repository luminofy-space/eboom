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
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = await fetchInvitationRows(eq(canvasInvitations.invitedBy, user.id));
    const invitations = await Promise.all(rows.map(formatInvitation));
    res.json({ invitations });
  } catch (err) {
    console.error("Error fetching sent invitations:", err);
    res.status(500).json({ error: "Failed to fetch sent invitations" });
  }
});

router.get("/received/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

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
    res.status(500).json({ error: "Failed to fetch received invitations" });
  }
});

router.post("/:id/accept/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return res.status(400).json({ error: "Invalid invitation ID" });
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return res.status(404).json({ error: "Invitation not found" });
    if (invitation.inviteeUserId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const current = await markExpiredIfNeeded(invitation);
    if (current.status !== "pending") {
      return res.status(400).json({ error: `Invitation is ${current.status}` });
    }
    if (isExpired(current.expiresAt)) {
      return res.status(403).json({ error: "Invitation has expired" });
    }

    const [canvas] = await db
      .select()
      .from(canvases)
      .where(eq(canvases.id, current.canvasId));

    if (!canvas || canvas.isArchived) {
      return res.status(403).json({ error: "Canvas is no longer available" });
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
      return res.status(400).json({ error: "You are already a member of this canvas" });
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
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

router.post("/:id/decline/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return res.status(400).json({ error: "Invalid invitation ID" });
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return res.status(404).json({ error: "Invitation not found" });
    if (invitation.inviteeUserId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: `Invitation is ${invitation.status}` });
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
    res.status(500).json({ error: "Failed to decline invitation" });
  }
});

router.delete("/:id/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const invitationId = parseInt(String(req.params.id), 10);
  if (Number.isNaN(invitationId)) {
    return res.status(400).json({ error: "Invalid invitation ID" });
  }

  try {
    const [invitation] = await db
      .select()
      .from(canvasInvitations)
      .where(eq(canvasInvitations.id, invitationId));

    if (!invitation) return res.status(404).json({ error: "Invitation not found" });
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: `Invitation is ${invitation.status}` });
    }

    const isInviter = invitation.invitedBy === user.id;
    const membership = await getCanvasMembership(invitation.canvasId, user.id);
    const canManage =
      membership &&
      (membership.isOwner || membership.permissions.manage_members);

    if (!isInviter && !canManage) {
      return res.status(403).json({ error: "Insufficient permissions for this action" });
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
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

export default router;
