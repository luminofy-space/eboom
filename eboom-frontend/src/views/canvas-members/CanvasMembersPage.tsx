"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useCanvasMembers, type CanvasMember } from "@/src/hooks/useCanvasMembers";
import { CanvasDetailsHeader } from "./CanvasDetailsHeader";
import { MembersTable } from "./MembersTable";
import { PendingInvitationsTable } from "./PendingInvitationsTable";
import { InviteMembersForm } from "./InviteMembersForm";
import { ConfirmRemoveMemberDialog } from "./ConfirmRemoveMemberDialog";
import { toast } from "sonner";

function memberDisplayName(member: CanvasMember) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
}

export default function CanvasMembersPage() {
  const { t } = useTranslation("canvas-members");
  const { canvas: canvasId, activeCanvas } = useCanvas();
  const { canManageMembers } = useCanvasPermissions();
  const [removeTarget, setRemoveTarget] = useState<CanvasMember | null>(null);

  const {
    members,
    pendingInvitations,
    inviteSuggestions,
    isLoading,
    isLoadingPending,
    isLoadingSuggestions,
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
    invalidate,
  } = useCanvasMembers(canvasId, { includeSuggestions: canManageMembers });

  const removeMemberName = useMemo(
    () => (removeTarget ? memberDisplayName(removeTarget) : ""),
    [removeTarget]
  );

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    await removeMember(removeTarget.id);
    setRemoveTarget(null);
    toast.success(t("members.memberRemoved"));
  };

  return (
    <Container className="py-6">
      <Stack gap={8}>
        <Stack gap={4}>
          <Stack gap={1}>
            <Typography variant="title" className="text-2xl">
              {t("members.title")}
            </Typography>
            <Typography variant="muted-sm">{t("members.description")}</Typography>
          </Stack>
          <CanvasDetailsHeader canvas={activeCanvas} />
        </Stack>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>{t("members.currentMembers")}</CardTitle>
              <CardDescription>{t("members.currentMembersDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Stack align="center" className="py-8">
                  <Spinner />
                </Stack>
              ) : (
                <MembersTable
                  members={members}
                  canManage={canManageMembers}
                  onRoleChange={async (memberId, role) => {
                    await updateMemberRole({ memberId, role });
                    toast.success(t("members.roleUpdated"));
                  }}
                  onRemove={(memberId) => {
                    const member = members.find((m) => m.id === memberId);
                    if (member) setRemoveTarget(member);
                  }}
                  isUpdating={isUpdatingRole}
                  isRemoving={isRemoving}
                />
              )}
            </CardContent>
          </Card>

          <Stack gap={6}>
            {canManageMembers && canvasId && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("members.inviteSection")}</CardTitle>
                  <CardDescription>{t("members.inviteSectionDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <InviteMembersForm
                    suggestions={inviteSuggestions}
                    isLoadingSuggestions={isLoadingSuggestions}
                    onLookup={async (emails) => {
                      const result = (await lookupUsers({ emails })) as {
                        users?: {
                          id: number;
                          email: string;
                          firstName?: string;
                          lastName?: string;
                        }[];
                      };
                      return {
                        users: (result?.users ?? []).map((user) => ({
                          id: user.id,
                          email: user.email,
                          firstName: user.firstName,
                          lastName: user.lastName,
                          role: "visitor",
                        })),
                      };
                    }}
                    isLookingUp={isLookingUp}
                    onSubmit={async (invitations) => {
                      await sendInvitations({ invitations });
                      invalidate();
                      toast.success(t("members.sendInvitations"));
                    }}
                    isSubmitting={isInviting}
                    hideSectionTitle
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t("members.pendingInvitations")}</CardTitle>
                <CardDescription>{t("members.pendingInvitationsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <Stack align="center" className="py-8">
                    <Spinner />
                  </Stack>
                ) : (
                  <PendingInvitationsTable
                    invitations={pendingInvitations}
                    canManage={canManageMembers}
                    onCancel={async (invitationId) => {
                      await cancelInvitation(invitationId);
                      toast.success(t("members.invitationCancelled"));
                    }}
                    isCancelling={isCancellingInvitation}
                  />
                )}
              </CardContent>
            </Card>
          </Stack>
        </div>
      </Stack>

      <ConfirmRemoveMemberDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={handleConfirmRemove}
        memberName={removeMemberName}
        isRemoving={isRemoving}
      />
    </Container>
  );
}
