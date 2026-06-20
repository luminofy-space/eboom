"use client";

import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { env } from "@/utils/env";

const hasWindow = typeof window !== "undefined";

function getAuthHeaders() {
  const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  const baseUrl = env("NEXT_PUBLIC_BASE_URL");

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
      hasToken: true,
    }
  );

  const { mutateAsync: lookupUsers, isPending: isLookingUp } = useMutationApi(
    canvasId ? API_ROUTES.CANVAS_MEMBERS_LOOKUP(canvasId) : "",
    {
      method: "post",
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

  const { mutateAsync: updateMemberRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      if (!canvasId) return;
      await axios.patch(
        `${baseUrl}${API_ROUTES.CANVAS_MEMBERS_UPDATE(canvasId, memberId)}`,
        { role },
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: invalidate,
  });

  const { mutateAsync: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: async (memberId: number) => {
      if (!canvasId) return;
      await axios.delete(
        `${baseUrl}${API_ROUTES.CANVAS_MEMBERS_REMOVE(canvasId, memberId)}`,
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: invalidate,
  });

  const { mutateAsync: cancelInvitation, isPending: isCancellingInvitation } = useMutation({
    mutationFn: async (invitationId: number) => {
      await axios.delete(`${baseUrl}${API_ROUTES.CANVAS_INVITATIONS_CANCEL(invitationId)}`, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: invalidate,
  });

  const { mutateAsync: leaveCanvas, isPending: isLeaving } = useMutation({
    mutationFn: async () => {
      if (!canvasId) return;
      await axios.post(
        `${baseUrl}${API_ROUTES.CANVAS_MEMBERS_LEAVE(canvasId)}`,
        {},
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: invalidate,
  });

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
