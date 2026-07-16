"use client";

import { ChevronsUpDown, LogOut, Pencil, Plus, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewCanvasModal } from "./NewCanvasModal";
import { ConfirmLeaveCanvasDialog } from "./ConfirmLeaveCanvasDialog";
import { parseCanvasIcon } from "./canvasUtils";
import { useMemo, useState } from "react";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useCanvasMembers } from "@/src/hooks/useCanvasMembers";
import { useAppDispatch } from "@/src/redux/store";
import {
  openCanvasCreateModal,
  openCanvasEditModal,
} from "@/src/redux/canvasSlice";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { useTranslation } from "react-i18next";
import { useTextDirection } from "@/src/i18n/useTextDirection";
import type { CanvasWithMembership } from "@/src/hooks/useCanvasPermissions";

function CanvasIcon({ photoUrl, size = "md" }: { photoUrl?: string; size?: "sm" | "md" }) {
  const { emoji, color } = parseCanvasIcon(photoUrl);
  const sizeClass = size === "sm" ? "size-6 text-sm" : "size-8 text-lg";
  return (
    <div
      className={`flex shrink-0 aspect-square ${sizeClass} items-center justify-center rounded-lg select-none`}
      style={{ backgroundColor: color }}
    >
      {emoji}
    </div>
  );
}

export function CanvasSwitcher() {
  const { t } = useTranslation("canvas");
  const { t: tm } = useTranslation("canvas-members");
  const { isMobile, setOpenMobile } = useSidebar();
  const { dropdownSide } = useTextDirection();
  const dispatch = useAppDispatch();

  const { canvases, canvas, isQueryLoading, selectCanvas, refetch } = useCanvas();
  const { isOwner } = useCanvasPermissions();
  const { leaveCanvas, isLeaving } = useCanvasMembers(canvas);

  const activeCanvas = useMemo(
    () => (canvases as CanvasWithMembership[]).find((c) => c.id === canvas) ?? null,
    [canvases, canvas]
  );

  const ownedCanvases = useMemo(
    () => (canvases as CanvasWithMembership[]).filter((c) => c.isOwner),
    [canvases]
  );

  const joinedCanvases = useMemo(
    () => (canvases as CanvasWithMembership[]).filter((c) => !c.isOwner),
    [canvases]
  );

  const renderCanvasItem = (c: CanvasWithMembership) => {
    const itemCanManage = c.isOwner || c.permissions?.manageCanvas;
    return (
      <DropdownMenuItem
        key={c.id}
        onClick={() => {
          if (canvas === c.id) return;
          selectCanvas(c.id);
          if (isMobile) setOpenMobile(false);
        }}
        className="gap-2 p-2 group/canvas-item"
      >
        <CanvasIcon photoUrl={c.photoUrl ?? undefined} size="sm" />
        <span className="truncate flex-1">{c.name}</span>
        {itemCanManage && (
          <div className="flex gap-1 opacity-0 group-hover/canvas-item:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-1 rounded hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(openCanvasEditModal({
                  id: c.id,
                  name: c.name,
                  description: c.description,
                  photoUrl: c.photoUrl,
                  canvasType: c.canvasType,
                  lastModifiedAt: c.lastModifiedAt?.toString() ?? null,
                }));
              }}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(c.id);
              }}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </button>
          </div>
        )}
      </DropdownMenuItem>
    );
  };

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { mutate: deleteCanvas, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.CANVASES_DELETE(id),
    {
      method: "delete",
      successKey: "success.canvas.deleted",
      onSuccess: () => setDeleteId(null),
    }
  );

  const handleLeave = async () => {
    if (!canvas) return;
    await leaveCanvas();
    setLeaveOpen(false);
    await refetch();
    const remaining = canvases.filter((c) => c.id !== canvas);
    if (remaining[0]) {
      selectCanvas(remaining[0].id);
    }
  };

  if (isQueryLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <CanvasIcon photoUrl={activeCanvas?.photoUrl ?? undefined} size="md" />
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeCanvas?.name ?? t("switcher.placeholder")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeCanvas?.canvasType ?? t("switcher.fallbackType")}
                  </span>
                </div>
                <ChevronsUpDown className="ms-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : dropdownSide}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {t("switcher.label")}
              </DropdownMenuLabel>

              {canvases.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                  {t("switcher.empty")}
                </DropdownMenuItem>
              ) : (
                <>
                  {ownedCanvases.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground text-xs">
                        {t("switcher.owned")}
                      </DropdownMenuLabel>
                      {ownedCanvases.map(renderCanvasItem)}
                    </>
                  )}
                  {ownedCanvases.length > 0 && joinedCanvases.length > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  {joinedCanvases.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground text-xs">
                        {t("switcher.joined")}
                      </DropdownMenuLabel>
                      {joinedCanvases.map(renderCanvasItem)}
                    </>
                  )}
                </>
              )}

              <DropdownMenuSeparator />

              {activeCanvas && !isOwner && (
                <DropdownMenuItem
                  className="gap-2 p-2 cursor-pointer text-destructive"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="size-4" />
                  <span>{tm("switcher.leaveCanvas")}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => dispatch(openCanvasCreateModal())}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">{t("switcher.addNew")}</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <NewCanvasModal />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId !== null) deleteCanvas(deleteId); }}
        isDeleting={isDeleting}
      />

      {activeCanvas && (
        <ConfirmLeaveCanvasDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          canvasName={activeCanvas.name}
          onConfirm={handleLeave}
          isLeaving={isLeaving}
        />
      )}
    </>
  );
}
