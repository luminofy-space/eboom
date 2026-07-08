"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "@/components/ui/stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useCanvasInvitations } from "@/src/hooks/useCanvasInvitations";
import { InvitationCard } from "@/src/views/canvas-invitations/InvitationCard";

interface CanvasInvitationsPanelProps {
  onClose?: () => void;
}

export function CanvasInvitationsPanel({ onClose: _onClose }: CanvasInvitationsPanelProps) {
  const { t } = useTranslation("canvas-members");
  const [actionId, setActionId] = useState<number | null>(null);

  const {
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
  } = useCanvasInvitations();

  const pendingSentCount = sent.filter((i) => i.status === "pending").length;
  const isBusy = isAccepting || isDeclining || isCancelling;

  return (
    <Tabs defaultValue="received" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="received" className="flex-1">
          {t("invitations.tabs.received")}
          {pendingReceivedCount > 0 && (
            <Badge variant="secondary" className="ms-2">
              {pendingReceivedCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex-1">
          {t("invitations.tabs.sent")}
          {pendingSentCount > 0 && (
            <Badge variant="secondary" className="ms-2">
              {pendingSentCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received">
        {isLoadingReceived ? (
          <Stack align="center" className="py-6">
            <Spinner />
          </Stack>
        ) : received.length === 0 ? (
          <Typography variant="muted-sm" className="py-4 text-center">
            {t("invitations.empty.received")}
          </Typography>
        ) : (
          <Stack gap={3} className="max-h-80 overflow-y-auto pt-2">
            {received.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                variant="received"
                isLoading={isBusy && actionId === invitation.id}
                onAccept={async () => {
                  setActionId(invitation.id);
                  await acceptInvitation(invitation.id);
                  setActionId(null);
                }}
                onDecline={async () => {
                  setActionId(invitation.id);
                  await declineInvitation(invitation.id);
                  setActionId(null);
                }}
              />
            ))}
          </Stack>
        )}
      </TabsContent>

      <TabsContent value="sent">
        {isLoadingSent ? (
          <Stack align="center" className="py-6">
            <Spinner />
          </Stack>
        ) : sent.length === 0 ? (
          <Typography variant="muted-sm" className="py-4 text-center">
            {t("invitations.empty.sent")}
          </Typography>
        ) : (
          <Stack gap={3} className="max-h-80 overflow-y-auto pt-2">
            {sent.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                variant="sent"
                isLoading={isBusy && actionId === invitation.id}
                onCancel={async () => {
                  setActionId(invitation.id);
                  await cancelInvitation(invitation.id);
                  setActionId(null);
                }}
              />
            ))}
          </Stack>
        )}
      </TabsContent>
    </Tabs>
  );
}
