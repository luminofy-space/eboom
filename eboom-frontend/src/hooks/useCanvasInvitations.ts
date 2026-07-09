"use client";

import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useQueryClient } from "@tanstack/react-query";

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

  const { mutateAsync: acceptInvitation, isPending: isAccepting } = useMutationApi(
    (id: number) => API_ROUTES.CANVAS_INVITATIONS_ACCEPT(id),
    { method: "post", successKey: "success.member.invitationAccepted", onSuccess: invalidate, invalidateQueries: false }
  );

  const { mutateAsync: declineInvitation, isPending: isDeclining } = useMutationApi(
    (id: number) => API_ROUTES.CANVAS_INVITATIONS_DECLINE(id),
    { method: "post", successKey: "success.member.invitationDeclined", onSuccess: invalidate, invalidateQueries: false }
  );

  const { mutateAsync: cancelInvitation, isPending: isCancelling } = useMutationApi(
    (id: number) => API_ROUTES.CANVAS_INVITATIONS_CANCEL(id),
    { method: "delete", successKey: "success.member.invitationCancelled", onSuccess: invalidate, invalidateQueries: false }
  );

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
