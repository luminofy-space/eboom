"use client";

import { useTranslation } from "react-i18next";
import { DataTable, type DataTableColumn } from "@/src/components/data-table";
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
import { MemberIdentity } from "./UserAvatar";
import type { CanvasMember } from "@/src/hooks/useCanvasMembers";
import { Loader2, UserMinus } from "lucide-react";
import { useMemo } from "react";

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

  const columns: DataTableColumn<CanvasMember>[] = useMemo(
    () => [
      {
        id: "member",
        header: "Member",
        cell: (member) => (
          <MemberIdentity
            photoUrl={member.photoUrl}
            firstName={member.firstName}
            lastName={member.lastName}
            email={member.email}
          />
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (member) =>
          member.isOwner ? (
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
          ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: "",
              headerClassName: "w-[100px]",
              cell: (member: CanvasMember) =>
                !member.isOwner ? (
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
                ) : null,
            } satisfies DataTableColumn<CanvasMember>,
          ]
        : []),
    ],
    [canManage, isRemoving, isUpdating, onRemove, onRoleChange, roleLabels, t]
  );

  if (members.length === 0) {
    return <Typography variant="muted-sm">{t("members.noMembers")}</Typography>;
  }

  return (
    <DataTable
      bordered={false}
      columns={columns}
      data={members}
      getRowKey={(member) => member.id}
      emptyMessage={t("members.noMembers")}
    />
  );
}
