"use client";

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleChip } from "@/src/views/canvas-members/RoleChip";
import { roleNameToValue } from "@/src/views/canvas-members/MemberRoleSelect";
import type { CanvasInvitation } from "@/src/hooks/useCanvasInvitations";
import { Loader2 } from "lucide-react";
import { CanvasIcon } from "@/src/components/canvas/CanvasIconDisplay";

interface InvitationCardProps {
  invitation: CanvasInvitation;
  variant: "sent" | "received";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function InvitationCard({
  invitation,
  variant,
  onAccept,
  onDecline,
  onCancel,
  isLoading = false,
}: InvitationCardProps) {
  const { t } = useTranslation("canvas-members");

  const counterparty =
    variant === "sent"
      ? invitation.invitee
      : invitation.inviter;

  const counterpartyName =
    [counterparty.firstName, counterparty.lastName].filter(Boolean).join(" ") ||
    counterparty.email;

  const statusLabel = t(`invitations.status.${invitation.status}`, {
    defaultValue: invitation.status,
  });

  const roleLabel = t(`roles.${roleNameToValue(invitation.roleName)}`, {
    defaultValue: invitation.roleName ?? t("roles.visitor"),
  });
  const isPending = invitation.status === "pending";

  return (
    <Card className="p-4">
      <Stack direction="row" gap={4} align="start">
        <CanvasIcon photoUrl={invitation.canvas.photoUrl ?? undefined} size="md" />
        <Stack className="flex-1" gap={2}>
          <Stack direction="row" align="center" justify="between" gap={2}>
            <Typography variant="title">{invitation.canvas.name}</Typography>
            <Badge variant={isPending ? "default" : "secondary"}>{statusLabel}</Badge>
          </Stack>

          {invitation.canvas.description && (
            <Typography variant="muted-sm">{invitation.canvas.description}</Typography>
          )}

          <Typography variant="muted-sm">
            {variant === "sent"
              ? t("invitations.to", { name: counterpartyName })
              : t("invitations.from", { name: counterpartyName })}
          </Typography>

          <RoleChip roleName={invitation.roleName} label={roleLabel} />

          {isPending && variant === "received" && (
            <Stack direction="row" gap={2}>
              <Button size="sm" onClick={onAccept} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("invitations.actions.accept")}
              </Button>
              <Button size="sm" variant="outline" onClick={onDecline} disabled={isLoading}>
                {t("invitations.actions.decline")}
              </Button>
            </Stack>
          )}

          {isPending && variant === "sent" && (
            <Button size="sm" variant="outline" onClick={onCancel} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("invitations.actions.cancel")}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
