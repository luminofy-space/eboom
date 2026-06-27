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
  getCanvasMembership,
  normalizeRoleName,
  requireCanvasPermission,
  resolveRoleIdByName,
} from "../services/canvasAccessService";

const router = express.Router({ mergeParams: true });

const INVITATION_TTL_DAYS = 7;
const SUGGESTION_LIMIT = 30;

const inviteeUsers = alias(users, "invitee_users");

function getCanvasId(req: Request): number | null {
  const canvasId = parseInt(String(req.params.canvasId), 10);
  return Number.isNaN(canvasId) ? null : canvasId;
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "view");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

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
    res.status(500).json({ error: "Failed to fetch canvas members" });
  }
});

router.get("/invitations/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "view");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

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
    res.status(500).json({ error: "Failed to fetch canvas invitations" });
  }
});

router.get("/suggestions/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "manage_members");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

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
    res.status(500).json({ error: "Failed to fetch invite suggestions" });
  }
});

router.post("/lookup/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  const { emails } = req.body as { emails?: string[] };
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "emails array is required" });
  }

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "manage_members");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

    const normalizedEmails = emails.map((e) => String(e).trim().toLowerCase());
    const foundUsers = await db
      .select()
      .from(users)
      .where(inArray(users.email, normalizedEmails));

    const usersByEmail = new Map(foundUsers.map((u) => [u.email.toLowerCase(), u]));

    const missingEmails = normalizedEmails.filter((email) => !usersByEmail.has(email));
    if (missingEmails.length > 0) {
      return res.status(400).json({
        error: "Some users were not found",
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
    res.status(500).json({ error: "Failed to look up users" });
  }
});

router.post("/invitations/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  const { invitations } = req.body as {
    invitations?: { email: string; role: string }[];
  };

  if (!Array.isArray(invitations) || invitations.length === 0) {
    return res.status(400).json({ error: "invitations array is required" });
  }

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "manage_members");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

    const [canvas] = await db.select().from(canvases).where(eq(canvases.id, canvasId));
    if (!canvas || canvas.isArchived) {
      return res.status(404).json({ error: "Canvas not found" });
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
      return res.status(400).json({ error: "No invitations created", errors });
    }

    res.status(201).json({ invitations: created, errors });
  } catch (err) {
    console.error("Error creating invitations:", err);
    res.status(500).json({ error: "Failed to create invitations" });
  }
});

router.patch("/:memberId/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  const memberId = parseInt(String(req.params.memberId), 10);
  if (Number.isNaN(memberId)) return res.status(400).json({ error: "Invalid member ID" });

  const { role } = req.body as { role?: string };
  if (!role) return res.status(400).json({ error: "role is required" });

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "manage_members");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

    const [target] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(eq(canvasMembers.id, memberId), eq(canvasMembers.canvasId, canvasId))
      );

    if (!target) return res.status(404).json({ error: "Member not found" });
    if (target.isOwner) {
      return res.status(403).json({ error: "Cannot change the owner's role" });
    }

    const roleId = await resolveRoleIdByName(String(role));
    if (!roleId) return res.status(400).json({ error: "Invalid role" });

    const [updated] = await db
      .update(canvasMembers)
      .set({ roleId, lastModifiedAt: new Date() })
      .where(eq(canvasMembers.id, memberId))
      .returning();

    res.json({ member: updated });
  } catch (err) {
    console.error("Error updating member role:", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
});

router.delete("/:memberId/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  const memberId = parseInt(String(req.params.memberId), 10);
  if (Number.isNaN(memberId)) return res.status(400).json({ error: "Invalid member ID" });

  try {
    const membership = await requireCanvasPermission(canvasId, user.id, "manage_members");
    if (!membership) {
      const existing = await getCanvasMembership(canvasId, user.id);
      if (!existing) return res.status(403).json({ error: "Access denied to this canvas" });
      return res.status(403).json({ error: "Insufficient permissions for this action" });
    }

    const [target] = await db
      .select()
      .from(canvasMembers)
      .where(
        and(eq(canvasMembers.id, memberId), eq(canvasMembers.canvasId, canvasId))
      );

    if (!target) return res.status(404).json({ error: "Member not found" });
    if (target.isOwner) {
      return res.status(403).json({ error: "Cannot remove the canvas owner" });
    }

    await db.delete(canvasMembers).where(eq(canvasMembers.id, memberId));
    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

router.post("/leave/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const canvasId = getCanvasId(req);
  if (!canvasId) return res.status(400).json({ error: "Invalid canvas ID" });

  try {
    const membership = await getCanvasMembership(canvasId, user.id);
    if (!membership) {
      return res.status(403).json({ error: "Access denied to this canvas" });
    }

    if (membership.isOwner) {
      return res.status(403).json({
        error: "Canvas owner cannot leave. Transfer ownership or delete the canvas first.",
      });
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
    res.status(500).json({ error: "Failed to leave canvas" });
  }
});

export default router;
