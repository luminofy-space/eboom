import express, { Request, Response } from "express";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
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
  normalizeRoleName,
  resolveRoleIdByName,
} from "../services/canvasAccessService";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

const INVITATION_TTL_DAYS = 7;
const SUGGESTION_LIMIT = 30;

const inviteeUsers = alias(users, "invitee_users");

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const members = await db
      .select({
        member: canvasMembers,
        user: users,
        role: roles,
      })
      .from(canvasMembers)
      .innerJoin(users, eq(canvasMembers.userId, users.id))
      .leftJoin(roles, eq(canvasMembers.roleId, roles.id))
      .where(eq(canvasMembers.canvasId, canvasId))
      .orderBy(asc(canvasMembers.createdAt));

    res.json({
      members: members.map((m) => ({
        id: m.member.id,
        userId: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        photoUrl: m.user.photoUrl,
        isOwner: m.member.isOwner,
        roleId: m.member.roleId,
        roleName: m.role?.name ?? null,
        joinedAt: m.member.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching canvas members:", err);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.get("/invitations/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const rows = await db
      .select({
        invitation: canvasInvitations,
        invitee: inviteeUsers,
        role: roles,
        inviter: users,
      })
      .from(canvasInvitations)
      .innerJoin(inviteeUsers, eq(canvasInvitations.inviteeUserId, inviteeUsers.id))
      .innerJoin(roles, eq(canvasInvitations.roleId, roles.id))
      .innerJoin(users, eq(canvasInvitations.invitedBy, users.id))
      .where(
        and(
          eq(canvasInvitations.canvasId, canvasId),
          eq(canvasInvitations.status, "pending")
        )
      )
      .orderBy(desc(canvasInvitations.createdAt));

    res.json({
      invitations: rows.map((row) => ({
        id: row.invitation.id,
        status: row.invitation.status,
        roleName: row.role.name,
        createdAt: row.invitation.createdAt,
        expiresAt: row.invitation.expiresAt,
        invitee: {
          id: row.invitee.id,
          email: row.invitee.email,
          firstName: row.invitee.firstName,
          lastName: row.invitee.lastName,
          photoUrl: row.invitee.photoUrl,
        },
        inviter: {
          id: row.inviter.id,
          email: row.inviter.email,
          firstName: row.inviter.firstName,
          lastName: row.inviter.lastName,
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching canvas invitations:", err);
    sendError(res, ErrorKeys.invitation.fetchFailed, 500);
  }
});

router.get("/suggestions/", requireCanvasAccess("manage_members"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  try {
    const otherCanvasRows = await db
      .select({ canvasId: canvasMembers.canvasId })
      .from(canvasMembers)
      .where(and(eq(canvasMembers.userId, user.id), ne(canvasMembers.canvasId, canvasId)));

    const otherCanvasIds = otherCanvasRows.map((row) => row.canvasId);
    if (otherCanvasIds.length === 0) {
      return res.json({ users: [] });
    }

    const existingMemberRows = await db
      .select({ userId: canvasMembers.userId })
      .from(canvasMembers)
      .where(eq(canvasMembers.canvasId, canvasId));
    const existingMemberIds = new Set(existingMemberRows.map((row) => row.userId));

    const pendingInviteRows = await db
      .select({ userId: canvasInvitations.inviteeUserId })
      .from(canvasInvitations)
      .where(
        and(
          eq(canvasInvitations.canvasId, canvasId),
          eq(canvasInvitations.status, "pending")
        )
      );
    const pendingInviteeIds = new Set(pendingInviteRows.map((row) => row.userId));

    const memberRows = await db
      .select({
        user: users,
        joinedAt: canvasMembers.createdAt,
      })
      .from(canvasMembers)
      .innerJoin(users, eq(canvasMembers.userId, users.id))
      .where(
        and(
          inArray(canvasMembers.canvasId, otherCanvasIds),
          ne(canvasMembers.userId, user.id)
        )
      )
      .orderBy(desc(canvasMembers.createdAt));

    const seenUserIds = new Set<number>();
    const suggestions: {
      id: number;
      email: string;
      firstName: string | null;
      lastName: string | null;
      photoUrl: string | null;
      joinedAt: Date | null;
    }[] = [];

    for (const row of memberRows) {
      if (existingMemberIds.has(row.user.id)) continue;
      if (pendingInviteeIds.has(row.user.id)) continue;
      if (seenUserIds.has(row.user.id)) continue;

      seenUserIds.add(row.user.id);
      suggestions.push({
        id: row.user.id,
        email: row.user.email,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        photoUrl: row.user.photoUrl,
        joinedAt: row.joinedAt,
      });

      if (suggestions.length >= SUGGESTION_LIMIT) break;
    }

    res.json({ users: suggestions });
  } catch (err) {
    console.error("Error fetching invite suggestions:", err);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.post("/lookup/", requireCanvasAccess("manage_members"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const { emails } = req.body as { emails?: string[] };
  if (!Array.isArray(emails) || emails.length === 0) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  try {
    const normalizedEmails = emails.map((e) => String(e).trim().toLowerCase());
    const foundUsers = await db
      .select()
      .from(users)
      .where(inArray(users.email, normalizedEmails));

    const usersByEmail = new Map(foundUsers.map((u) => [u.email.toLowerCase(), u]));

    const missingEmails = normalizedEmails.filter((email) => !usersByEmail.has(email));
    if (missingEmails.length > 0) {
      return res.status(400).json({
        errorKey: ErrorKeys.member.notFound,
        params: { count: missingEmails.length },
        missingEmails,
      });
    }

    res.json({
      users: normalizedEmails.map((email) => {
        const u = usersByEmail.get(email)!;
        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          photoUrl: u.photoUrl,
        };
      }),
    });
  } catch (err) {
    console.error("Error looking up users:", err);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.post("/invitations/", requireCanvasAccess("manage_members"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { invitations } = req.body as {
    invitations?: { email: string; role: string }[];
  };

  if (!Array.isArray(invitations) || invitations.length === 0) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  try {
    const [canvas] = await db.select().from(canvases).where(eq(canvases.id, canvasId));
    if (!canvas || canvas.isArchived) {
      return sendError(res, ErrorKeys.canvas.notFound, 404);
    }

    const created: { id: number; email: string; role: string; status: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (const invite of invitations) {
      const email = String(invite.email).trim().toLowerCase();
      const roleName = normalizeRoleName(String(invite.role));

      const [invitee] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!invitee) {
        errors.push({ email, error: "User not found" });
        continue;
      }

      if (invitee.id === user.id) {
        errors.push({ email, error: "Cannot invite yourself" });
        continue;
      }

      const [existingMember] = await db
        .select()
        .from(canvasMembers)
        .where(
          and(
            eq(canvasMembers.canvasId, canvasId),
            eq(canvasMembers.userId, invitee.id)
          )
        );

      if (existingMember) {
        errors.push({ email, error: "User is already a member" });
        continue;
      }

      const roleId = await resolveRoleIdByName(roleName);
      if (!roleId) {
        errors.push({ email, error: "Invalid role" });
        continue;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

      const [existingInvite] = await db
        .select()
        .from(canvasInvitations)
        .where(
          and(
            eq(canvasInvitations.canvasId, canvasId),
            eq(canvasInvitations.inviteeUserId, invitee.id)
          )
        );

      if (existingInvite) {
        if (existingInvite.status === "pending") {
          errors.push({ email, error: "Invitation already pending" });
          continue;
        }

        const [updated] = await db
          .update(canvasInvitations)
          .set({
            roleId,
            invitedBy: user.id,
            inviteeEmail: invitee.email,
            status: "pending",
            expiresAt,
            respondedAt: null,
            lastModifiedAt: new Date(),
          })
          .where(eq(canvasInvitations.id, existingInvite.id))
          .returning();

        created.push({
          id: updated.id,
          email: invitee.email,
          role: roleName,
          status: updated.status,
        });
        continue;
      }

      const [inserted] = await db
        .insert(canvasInvitations)
        .values({
          canvasId,
          inviteeUserId: invitee.id,
          inviteeEmail: invitee.email,
          roleId,
          invitedBy: user.id,
          status: "pending",
          expiresAt,
        })
        .returning();

      created.push({
        id: inserted.id,
        email: invitee.email,
        role: roleName,
        status: inserted.status,
      });
    }

    if (created.length === 0 && errors.length > 0) {
      return res.status(400).json({ errorKey: ErrorKeys.member.inviteFailed, errors });
    }

    res.status(201).json({ invitations: created, errors });
  } catch (err) {
    console.error("Error creating invitations:", err);
    sendError(res, ErrorKeys.member.inviteFailed, 500);
  }
});

router.patch("/:memberId/", requireCanvasAccess("manage_members"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const memberId = parseInt(String(req.params.memberId), 10);
  if (Number.isNaN(memberId)) return sendError(res, ErrorKeys.common.invalidId, 400);

  const { role } = req.body as { role?: string };
  if (!role) return sendError(res, ErrorKeys.validation.failed, 400);

  try {
    const [target] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(eq(canvasMembers.id, memberId), eq(canvasMembers.canvasId, canvasId))
      );

    if (!target) return sendError(res, ErrorKeys.member.notFound, 404);
    if (target.isOwner) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    const roleId = await resolveRoleIdByName(String(role));
    if (!roleId) return sendError(res, ErrorKeys.validation.failed, 400);

    const [updated] = await db
      .update(canvasMembers)
      .set({ roleId, lastModifiedAt: new Date() })
      .where(eq(canvasMembers.id, memberId))
      .returning();

    res.json({ member: updated });
  } catch (err) {
    console.error("Error updating member role:", err);
    sendError(res, ErrorKeys.member.updateRoleFailed, 500);
  }
});

router.delete("/:memberId/", requireCanvasAccess("manage_members"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  const memberId = parseInt(String(req.params.memberId), 10);
  if (Number.isNaN(memberId)) return sendError(res, ErrorKeys.common.invalidId, 400);

  try {
    const [target] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(eq(canvasMembers.id, memberId), eq(canvasMembers.canvasId, canvasId))
      );

    if (!target) return sendError(res, ErrorKeys.member.notFound, 404);
    if (target.isOwner) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    await db.delete(canvasMembers).where(eq(canvasMembers.id, memberId));
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    sendError(res, ErrorKeys.member.removeFailed, 500);
  }
});

router.post("/leave/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const membership = req.canvasMembership!;

  try {
    if (membership.isOwner) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    await db
      .delete(canvasMembers)
      .where(
        and(
          eq(canvasMembers.canvasId, canvasId),
          eq(canvasMembers.userId, user.id)
        )
      );

    res.json({ message: "Left canvas successfully" });
  } catch (err) {
    console.error("Error leaving canvas:", err);
    sendError(res, ErrorKeys.member.leaveFailed, 500);
  }
});

export default router;
