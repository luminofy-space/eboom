"use client";

import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { CanvasPendingInvitation } from "@/src/hooks/useCanvasMembers";
import { RoleChip } from "./RoleChip";
import { roleNameToValue } from "./MemberRoleSelect";
import { Loader2 } from "lucide-react";

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

  if (invitations.length === 0) {
    return <Typography variant="muted-sm">{t("members.noPendingInvitations")}</Typography>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("members.invitedMember")}</TableHead>
          <TableHead>{t("members.invitedRole")}</TableHead>
          {canManage && <TableHead className="w-[140px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => {
          const displayName =
            [invitation.invitee.firstName, invitation.invitee.lastName]
              .filter(Boolean)
              .join(" ") || invitation.invitee.email;

          return (
            <TableRow key={invitation.id}>
              <TableCell>
                <Typography variant="muted-sm" className="font-medium">
                  {displayName}
                </Typography>
                <Typography variant="muted-sm">{invitation.invitee.email}</Typography>
              </TableCell>
              <TableCell>
                <RoleChip
                  roleName={invitation.roleName}
                  label={t(`roles.${roleNameToValue(invitation.roleName)}`, {
                    defaultValue: invitation.roleName ?? t("roles.visitor"),
                  })}
                />
              </TableCell>
              {canManage && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isCancelling}
                    onClick={() => onCancel(invitation.id)}
                  >
                    {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("invitations.actions.cancel")}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
