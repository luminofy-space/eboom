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

const noPermissions: CanvasPermissions = {
  view: false,
  edit: false,
  manageMembers: false,
  manageCanvas: false,
};

export function useCanvasPermissions() {
  const { canvases, canvas: canvasId } = useCanvas();

  const activeCanvas = useMemo(
    () => (canvases as CanvasWithMembership[]).find((c) => c.id === canvasId) ?? null,
    [canvases, canvasId]
  );

  const isReady = activeCanvas?.permissions != null;
  const permissions = activeCanvas?.permissions ?? noPermissions;
  const isOwner = activeCanvas?.isOwner ?? false;
  const roleName = activeCanvas?.roleName ?? null;

  return {
    activeCanvas,
    permissions,
    isReady,
    isOwner,
    roleName,
    canView: isReady && permissions.view,
    canEdit: isReady && permissions.edit,
    canManageMembers: isReady && (isOwner || permissions.manageMembers),
    canManageCanvas: isReady && (isOwner || permissions.manageCanvas),
    isVisitor: isReady && !isOwner && permissions.view && !permissions.edit,
  };
}
