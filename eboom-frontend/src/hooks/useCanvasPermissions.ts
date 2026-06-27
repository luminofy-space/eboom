"use client";

import { useMemo } from "react";
import { Canvas } from "../types/common";
import { useCanvas } from "./useCanvas";

export type CanvasPermissions = {
  view: boolean;
  edit: boolean;
  manageMembers: boolean;
  manageCanvas: boolean;
};

export type CanvasWithMembership = Canvas & {
  isOwner?: boolean;
  roleId?: number | null;
  roleName?: string | null;
  permissions?: CanvasPermissions;
};

const defaultPermissions: CanvasPermissions = {
  view: true,
  edit: true,
  manageMembers: false,
  manageCanvas: false,
};

export function useCanvasPermissions() {
  const { canvases, canvas: canvasId } = useCanvas();

  const activeCanvas = useMemo(
    () => (canvases as CanvasWithMembership[]).find((c) => c.id === canvasId) ?? null,
    [canvases, canvasId]
  );

  const permissions = activeCanvas?.permissions ?? defaultPermissions;
  const isOwner = activeCanvas?.isOwner ?? false;
  const roleName = activeCanvas?.roleName ?? null;

  return {
    activeCanvas,
    permissions,
    isOwner,
    roleName,
    canView: permissions.view,
    canEdit: permissions.edit,
    canManageMembers: isOwner || permissions.manageMembers,
    canManageCanvas: isOwner || permissions.manageCanvas,
    isVisitor: !isOwner && permissions.view && !permissions.edit,
  };
}
