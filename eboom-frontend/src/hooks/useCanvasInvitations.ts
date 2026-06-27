"use client";

import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { env } from "@/utils/env";

const hasWindow = typeof window !== "undefined";

function getAuthHeaders() {
  const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type InvitationUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
};

export type InvitationCanvas = {
  id: number;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
};

export type CanvasInvitation = {
  id: number;
  status: string;
  roleName?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  respondedAt?: string | null;
  canvas: InvitationCanvas;
  inviter: InvitationUser;
  invitee: InvitationUser;
};

export function useCanvasInvitations() {
  const queryClient = useQueryClient();
  const baseUrl = env("NEXT_PUBLIC_BASE_URL");

  const { data: sentData, isLoading: isLoadingSent } = useQueryApi<{ invitations: CanvasInvitation[] }>(
    API_ROUTES.CANVAS_INVITATIONS_SENT,
    { queryKey: ["canvas-invitations", "sent"], hasToken: true }
  );

  const { data: receivedData, isLoading: isLoadingReceived } = useQueryApi<{
    invitations: CanvasInvitation[];
  }>(API_ROUTES.CANVAS_INVITATIONS_RECEIVED, {
    queryKey: ["canvas-invitations", "received"],
    hasToken: true,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["canvas-invitations"] });
    queryClient.invalidateQueries({ queryKey: ["canvases"] });
  };

  const { mutateAsync: acceptInvitation, isPending: isAccepting } = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(
        `${baseUrl}${API_ROUTES.CANVAS_INVITATIONS_ACCEPT(id)}`,
        {},
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: invalidate,
  });

  const { mutateAsync: declineInvitation, isPending: isDeclining } = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(
        `${baseUrl}${API_ROUTES.CANVAS_INVITATIONS_DECLINE(id)}`,
        {},
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: invalidate,
  });

  const { mutateAsync: cancelInvitation, isPending: isCancelling } = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${baseUrl}${API_ROUTES.CANVAS_INVITATIONS_CANCEL(id)}`, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: invalidate,
  });

  const sent = sentData?.invitations ?? [];
  const received = (receivedData?.invitations ?? []).filter(
    (invitation) => invitation.status !== "cancelled"
  );
  const pendingReceivedCount = received.filter((i) => i.status === "pending").length;

  return {
    sent,
    received,
    pendingReceivedCount,
    isLoadingSent,
    isLoadingReceived,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    isAccepting,
    isDeclining,
    isCancelling,
    invalidate,
  };
}
