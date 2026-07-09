"use client";

import { useTranslation } from "react-i18next";
import { DataTable, type DataTableColumn } from "@/src/components/data-table";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { CanvasPendingInvitation } from "@/src/hooks/useCanvasMembers";
import { RoleChip } from "./RoleChip";
import { roleNameToValue } from "./MemberRoleSelect";
import { MemberIdentity } from "./UserAvatar";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface PendingInvitationsTableProps {
  invitations: CanvasPendingInvitation[];
  canManage: boolean;
  onCancel: (invitationId: number) => void;
  isCancelling?: boolean;
}

export function PendingInvitationsTable({
  invitations,
  canManage,
  onCancel,
  isCancelling = false,
}: PendingInvitationsTableProps) {
  const { t } = useTranslation("canvas-members");

  const columns: DataTableColumn<CanvasPendingInvitation>[] = useMemo(
    () => [
      {
        id: "member",
        header: t("members.invitedMember"),
        cell: (invitation) => (
          <MemberIdentity
            photoUrl={invitation.invitee.photoUrl}
            firstName={invitation.invitee.firstName}
            lastName={invitation.invitee.lastName}
            email={invitation.invitee.email}
          />
        ),
      },
      {
        id: "role",
        header: t("members.invitedRole"),
        cell: (invitation) => (
          <RoleChip
            roleName={invitation.roleName}
            label={t(`roles.${roleNameToValue(invitation.roleName)}`, {
              defaultValue: invitation.roleName ?? t("roles.visitor"),
            })}
          />
        ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              headerClassName: "w-[140px]",
              cell: (invitation: CanvasPendingInvitation) => (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  disabled={isCancelling}
                  onClick={() => onCancel(invitation.id)}
                >
                  {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("invitations.actions.cancel")}
                </Button>
              ),
            } satisfies DataTableColumn<CanvasPendingInvitation>,
          ]
        : []),
    ],
    [canManage, isCancelling, onCancel, t]
  );

  if (invitations.length === 0) {
    return <Typography variant="muted-sm">{t("members.noPendingInvitations")}</Typography>;
  }

  return (
    <DataTable
      bordered={false}
      columns={columns}
      data={invitations}
      getRowKey={(invitation) => invitation.id}
      emptyMessage={t("members.noPendingInvitations")}
    />
  );
}
