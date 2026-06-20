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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MemberRoleSelect, roleNameToValue } from "./MemberRoleSelect";
import { RoleChip } from "./RoleChip";
import type { CanvasMember } from "@/src/hooks/useCanvasMembers";
import { Loader2, UserMinus } from "lucide-react";

interface MembersTableProps {
  members: CanvasMember[];
  canManage: boolean;
  onRoleChange: (memberId: number, role: string) => void;
  onRemove: (memberId: number) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export function MembersTable({
  members,
  canManage,
  onRoleChange,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: MembersTableProps) {
  const { t } = useTranslation("canvas-members");

  const roleLabels = {
    "roles.collaborator": t("roles.collaborator"),
    "roles.modifier": t("roles.modifier"),
    "roles.visitor": t("roles.visitor"),
  };

  if (members.length === 0) {
    return <Typography variant="muted-sm">{t("members.noMembers")}</Typography>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          {canManage && <TableHead className="w-[100px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const displayName =
            [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;

          return (
            <TableRow key={member.id}>
              <TableCell>
                <Typography variant="muted-sm" className="font-medium">
                  {displayName}
                </Typography>
                <Typography variant="muted-sm">{member.email}</Typography>
              </TableCell>
              <TableCell>
                {member.isOwner ? (
                  <RoleChip roleName="owner" label={t("roles.owner")} />
                ) : canManage ? (
                  <MemberRoleSelect
                    value={roleNameToValue(member.roleName)}
                    onChange={(role) => onRoleChange(member.id, role)}
                    labels={roleLabels}
                    disabled={isUpdating}
                  />
                ) : (
                  <RoleChip
                    roleName={member.roleName}
                    label={t(`roles.${roleNameToValue(member.roleName)}`, {
                      defaultValue: member.roleName ?? t("roles.visitor"),
                    })}
                  />
                )}
              </TableCell>
              {canManage && (
                <TableCell>
                  {!member.isOwner && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive"
                            disabled={isRemoving}
                            onClick={() => onRemove(member.id)}
                            aria-label={t("members.removeMember")}
                          >
                            {isRemoving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("members.removeMember")}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
