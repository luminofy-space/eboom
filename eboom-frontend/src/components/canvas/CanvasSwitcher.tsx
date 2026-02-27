"use client";

import { ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";

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
import { parseCanvasIcon } from "./canvasUtils";
import { useMemo, useState } from "react";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch } from "@/src/redux/store";
import {
  openCanvasCreateModal,
  openCanvasEditModal,
} from "@/src/redux/canvasSlice";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import API_ROUTES from "@/src/api/urls";

const hasWindow = typeof window !== "undefined";

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
  const { isMobile } = useSidebar();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { canvases, canvas, isQueryLoading, selectCanvas } = useCanvas();
  const activeCanvas = useMemo(
    () => canvases.find((c) => c.id === canvas) ?? null,
    [canvases, canvas]
  );

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { mutate: deleteCanvas, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.CANVASES_DELETE(id)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      await axios.delete(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries();
    },
  });

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
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeCanvas?.name ?? "Select a canvas"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeCanvas?.canvasType ?? "Canvas"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Canvases
              </DropdownMenuLabel>

              {canvases.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                  No canvases yet
                </DropdownMenuItem>
              ) : (
                canvases.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => selectCanvas(c.id)}
                    className="gap-2 p-2 group/canvas-item"
                  >
                    <CanvasIcon photoUrl={c.photoUrl ?? undefined} size="sm" />
                    <span className="truncate flex-1">{c.name}</span>
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
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => dispatch(openCanvasCreateModal())}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add a new Canvas</div>
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
    </>
  );
}
