import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { canvasMembers, roles } from "../db/schema";

export type CanvasPermission = "view" | "edit" | "manage_members" | "manage_canvas";

export interface CanvasPermissions {
  view: boolean;
  edit: boolean;
  manage_members: boolean;
  manage_canvas: boolean;
}

export interface CanvasMembership {
  memberId: number;
  canvasId: number;
  userId: number;
  isOwner: boolean;
  roleId: number | null;
  roleName: string | null;
  permissions: CanvasPermissions;
}

type RolePermissions = Partial<CanvasPermissions>;

const ROLE_NAME_MAP: Record<string, string> = {
  collaborator: "Collaborator",
  modifier: "Modifier",
  visitor: "Visitor",
};

export function normalizeRoleName(role: string): string {
  const key = role.toLowerCase();
  return ROLE_NAME_MAP[key] ?? role;
}

function parseRolePermissions(raw: unknown): RolePermissions {
  if (!raw || typeof raw !== "object") return {};
  return raw as RolePermissions;
}

export function computePermissions(
  isOwner: boolean,
  rolePermissions: RolePermissions
): CanvasPermissions {
  if (isOwner) {
    return {
      view: true,
      edit: true,
      manage_members: true,
      manage_canvas: true,
    };
  }

  return {
    view: !!rolePermissions.view,
    edit: !!rolePermissions.edit,
    manage_members: !!rolePermissions.manage_members,
    manage_canvas: !!rolePermissions.manage_canvas,
  };
}

export function membershipHasPermission(
  membership: CanvasMembership,
  permission: CanvasPermission
): boolean {
  return membership.permissions[permission];
}

export async function getCanvasMembership(
  canvasId: number,
  userId: number
): Promise<CanvasMembership | null> {
  const [row] = await db
    .select({
      member: canvasMembers,
      role: roles,
    })
    .from(canvasMembers)
    .leftJoin(roles, eq(canvasMembers.roleId, roles.id))
    .where(
      and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId))
    );

  if (!row) return null;

  const rolePermissions = parseRolePermissions(row.role?.permissions);

  return {
    memberId: row.member.id,
    canvasId: row.member.canvasId,
    userId: row.member.userId,
    isOwner: row.member.isOwner ?? false,
    roleId: row.member.roleId,
    roleName: row.role?.name ?? null,
    permissions: computePermissions(row.member.isOwner ?? false, rolePermissions),
  };
}

export async function requireCanvasPermission(
  canvasId: number,
  userId: number,
  permission: CanvasPermission
): Promise<CanvasMembership | null> {
  const membership = await getCanvasMembership(canvasId, userId);
  if (!membership) return null;
  if (!membershipHasPermission(membership, permission)) return null;
  return membership;
}

export async function resolveRoleIdByName(roleName: string): Promise<number | null> {
  const normalized = normalizeRoleName(roleName);
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, normalized));
  return role?.id ?? null;
}

export async function getCanvasRoles() {
  return db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.isSystemRole, true)
      )
    );
}

export function formatMembershipForResponse(membership: CanvasMembership) {
  return {
    isOwner: membership.isOwner,
    roleId: membership.roleId,
    roleName: membership.roleName,
    permissions: membership.permissions,
  };
}

