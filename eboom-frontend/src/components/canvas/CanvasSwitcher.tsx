"use client";

import { ChevronsUpDown, Plus } from "lucide-react";

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
import { useEffect, useState } from "react";
import { useCanvas } from "@/src/hooks/useCanvas";

interface Canvas {
  id: number;
  name: string;
  description?: string;
  canvasType?: string;
  photoUrl?: string;
  isOwner?: boolean;
}

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
  const [activeCanvas, setActiveCanvas] = useState<Canvas | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { canvases, isQueryLoading, selectCanvas, refetch } = useCanvas();

  useEffect(() => {
    if (canvases.length > 0 && !activeCanvas) {
      selectCanvas(canvases[0].id);
      setActiveCanvas(canvases[0] as Canvas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvases, activeCanvas]);

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
                <CanvasIcon photoUrl={activeCanvas?.photoUrl} size="md" />
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
                canvases.map((canvas) => (
                  <DropdownMenuItem
                    key={canvas.id}
                    onClick={() => {
                      selectCanvas(canvas.id);
                      setActiveCanvas(canvas as Canvas);
                    }}
                    className="gap-2 p-2"
                  >
                    <CanvasIcon photoUrl={canvas.photoUrl ?? undefined} size="sm" />
                    <span className="truncate">{canvas.name}</span>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setModalOpen(true)}
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

      <NewCanvasModal
        open={modalOpen}
        setOpen={setModalOpen}
        onCreated={() => refetch()}
      />
    </>
  );
}
