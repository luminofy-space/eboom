"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useNavigationProgress } from "@/src/components/navigation/NavigationProgress";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch } from "@/src/redux/store";
import { openCanvasEditModal } from "@/src/redux/canvasSlice";
import type { CanvasWithMembership } from "@/src/hooks/useCanvasPermissions";

interface CanvasPageActionsProps {
  canvas: CanvasWithMembership | null;
  canManageMembers: boolean;
  canManageCanvas: boolean;
  onInviteMember: () => void;
}

export function CanvasPageActions({
  canvas,
  canManageMembers,
  canManageCanvas,
  onInviteMember,
}: CanvasPageActionsProps) {
  const { t } = useTranslation("canvas-members");
  const dispatch = useAppDispatch();
  const { navigate } = useNavigationProgress();
  const { canvases, canvas: canvasId, selectCanvas, refetch } = useCanvas();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: deleteCanvas, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.CANVASES_DELETE(id),
    {
      method: "delete",
      successKey: "success.canvas.deleted",
      onSuccess: async () => {
        setDeleteOpen(false);
        await refetch();
        const remaining = canvases.filter((c) => c.id !== canvasId);
        if (remaining[0]) {
          selectCanvas(remaining[0].id);
        }
        navigate("/dashboard");
      },
    }
  );

  const hasActions = canManageMembers || canManageCanvas;
  if (!hasActions || !canvas) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t("actions.menu")}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canManageMembers && (
            <DropdownMenuItem onClick={onInviteMember}>
              <UserPlus className="size-4" />
              {t("actions.inviteMember")}
            </DropdownMenuItem>
          )}
          {canManageCanvas && (
            <DropdownMenuItem
              onClick={() =>
                dispatch(
                  openCanvasEditModal({
                    id: canvas.id,
                    name: canvas.name,
                    description: canvas.description,
                    photoUrl: canvas.photoUrl,
                    canvasType: canvas.canvasType,
                    lastModifiedAt: canvas.lastModifiedAt?.toString() ?? null,
                  })
                )
              }
            >
              <Pencil className="size-4" />
              {t("actions.editCanvas")}
            </DropdownMenuItem>
          )}
          {canManageCanvas && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("actions.deleteCanvas")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteCanvas(canvas.id)}
        isDeleting={isDeleting}
      />
    </>
  );
}
