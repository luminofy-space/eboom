"use client";

import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useQueryClient } from "@tanstack/react-query";

export type CanvasMember = {
  id: number;
  userId: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  isOwner: boolean;
  roleId?: number | null;
  roleName?: string | null;
  joinedAt?: string;
};

export type CanvasPendingInvitation = {
  id: number;
  status: string;
  roleName?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  invitee: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
  };
  inviter: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export type InviteSuggestion = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  joinedAt?: string | null;
};

export type CanvasRole = {
  id: number;
  name: string;
};

export function useCanvasMembers(
  canvasId: number | null,
  options?: { includeSuggestions?: boolean }
) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQueryApi<{ members: CanvasMember[] }>(
    canvasId ? API_ROUTES.CANVAS_MEMBERS_LIST(canvasId) : "",
    {
      queryKey: ["canvas-members", canvasId],
      enabled: !!canvasId,
      hasToken: true,
    }
  );

  const { data: pendingData, isLoading: isLoadingPending } = useQueryApi<{
    invitations: CanvasPendingInvitation[];
  }>(canvasId ? API_ROUTES.CANVAS_MEMBERS_PENDING_INVITATIONS(canvasId) : "", {
    queryKey: ["canvas-pending-invitations", canvasId],
    enabled: !!canvasId,
    hasToken: true,
  });

  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useQueryApi<{
    users: InviteSuggestion[];
  }>(canvasId ? API_ROUTES.CANVAS_MEMBERS_SUGGESTIONS(canvasId) : "", {
    queryKey: ["canvas-invite-suggestions", canvasId],
    enabled: !!canvasId && (options?.includeSuggestions ?? false),
    hasToken: true,
  });

  const { mutateAsync: sendInvitations, isPending: isInviting } = useMutationApi(
    canvasId ? API_ROUTES.CANVAS_MEMBERS_INVITE(canvasId) : "",
    {
      method: "post",
      notifySuccess: false,
      hasToken: true,
    }
  );

  const { mutateAsync: lookupUsers, isPending: isLookingUp } = useMutationApi(
    canvasId ? API_ROUTES.CANVAS_MEMBERS_LOOKUP(canvasId) : "",
    {
      method: "post",
      notifySuccess: false,
      hasToken: true,
    }
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["canvas-members", canvasId] });
    queryClient.invalidateQueries({ queryKey: ["canvas-pending-invitations", canvasId] });
    queryClient.invalidateQueries({ queryKey: ["canvas-invite-suggestions", canvasId] });
    queryClient.invalidateQueries({ queryKey: ["canvases"] });
    queryClient.invalidateQueries({ queryKey: ["canvas-invitations"] });
  };

  const { mutateAsync: updateMemberRole, isPending: isUpdatingRole } = useMutationApi(
    ({ memberId }: { memberId: number; role: string }) =>
      API_ROUTES.CANVAS_MEMBERS_UPDATE(canvasId!, memberId),
    {
      method: "patch",
    successKey: "success.member.roleUpdated",
      mapPayload: ({ role }: { memberId: number; role: string }) => ({ role }),
      onSuccess: invalidate,
      invalidateQueries: false,
    }
  );

  const { mutateAsync: removeMember, isPending: isRemoving } = useMutationApi(
    (memberId: number) => API_ROUTES.CANVAS_MEMBERS_REMOVE(canvasId!, memberId),
    {
      method: "delete",
    successKey: "success.member.removed",
      onSuccess: invalidate,
      invalidateQueries: false,
    }
  );

  const { mutateAsync: cancelInvitation, isPending: isCancellingInvitation } = useMutationApi(
    (invitationId: number) => API_ROUTES.CANVAS_INVITATIONS_CANCEL(invitationId),
    {
      method: "delete",
    successKey: "success.member.invitationCancelled",
      onSuccess: invalidate,
      invalidateQueries: false,
    }
  );

  const { mutateAsync: leaveCanvas, isPending: isLeaving } = useMutationApi<void>(
    () => API_ROUTES.CANVAS_MEMBERS_LEAVE(canvasId!),
    {
      method: "post",
      onSuccess: invalidate,
      invalidateQueries: false,
    }
  );

  return {
    members: data?.members ?? [],
    pendingInvitations: pendingData?.invitations ?? [],
    inviteSuggestions: suggestionsData?.users ?? [],
    isLoading,
    isLoadingPending,
    isLoadingSuggestions,
    refetch,
    sendInvitations,
    isInviting,
    lookupUsers,
    isLookingUp,
    updateMemberRole,
    isUpdatingRole,
    removeMember,
    isRemoving,
    cancelInvitation,
    isCancellingInvitation,
    leaveCanvas,
    isLeaving,
    invalidate,
  };
}

export function useCanvasRoles() {
  const { data, isLoading } = useQueryApi<{ roles: CanvasRole[] }>(API_ROUTES.CANVAS_ROLES, {
    queryKey: ["canvas-roles"],
    hasToken: true,
  });

  return { roles: data?.roles ?? [], isLoading };
}
