"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useCanvasMembers, type CanvasMember } from "@/src/hooks/useCanvasMembers";
import { notifySuccess } from "@/src/lib/notify";
import { CanvasDetailsHeader } from "./CanvasDetailsHeader";
import { MembersTable } from "./MembersTable";
import { PendingInvitationsTable } from "./PendingInvitationsTable";
import { InviteMembersModal } from "./InviteMembersModal";
import { CanvasPageActions } from "./CanvasPageActions";
import { ConfirmRemoveMemberDialog } from "./ConfirmRemoveMemberDialog";

function memberDisplayName(member: CanvasMember) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
}

export default function CanvasMembersPage() {
  const { t } = useTranslation("canvas-members");
  const { canvas: canvasId } = useCanvas();
  const { canManageMembers, canManageCanvas, activeCanvas } = useCanvasPermissions();
  const [removeTarget, setRemoveTarget] = useState<CanvasMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

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

  const hasPendingInvitations = pendingInvitations.length > 0;

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    await removeMember(removeTarget.id);
    setRemoveTarget(null);
  };

  const handleSendInvitations = async (invitations: { email: string; role: string }[]) => {
    await sendInvitations({ invitations });
    invalidate();
    notifySuccess("success.member.invited");
    setPendingOpen(true);
  };

  return (
    <Container className="py-6">
      <Stack gap={8}>
        <div className="flex items-start justify-between gap-4">
          <Stack gap={1}>
            <Typography variant="title" className="text-2xl">
              {t("members.title")}
            </Typography>
            <Typography variant="muted-sm">{t("members.description")}</Typography>
          </Stack>
          <CanvasPageActions
            canvas={activeCanvas}
            canManageMembers={canManageMembers}
            canManageCanvas={canManageCanvas}
            onInviteMember={() => setInviteOpen(true)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("members.canvasDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CanvasDetailsHeader canvas={activeCanvas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{t("members.canvasMembers")}</CardTitle>
              <CardDescription>{t("members.canvasMembersDescription")}</CardDescription>
            </div>
            {canManageMembers && canvasId && (
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                {t("actions.addMember")}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
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
                }}
                onRemove={(memberId) => {
                  const member = members.find((m) => m.id === memberId);
                  if (member) setRemoveTarget(member);
                }}
                isUpdating={isUpdatingRole}
                isRemoving={isRemoving}
              />
            )}

            {hasPendingInvitations && (
              <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
                <div className="flex justify-center">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <span>
                        {pendingOpen
                          ? t("members.hidePendingInvitations")
                          : t("members.showPendingInvitations")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          pendingOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pt-4">
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
                      }}
                      isCancelling={isCancellingInvitation}
                    />
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      </Stack>

      {canManageMembers && canvasId && (
        <InviteMembersModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          suggestions={inviteSuggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          onLookup={async (emails) => {
            const result = (await lookupUsers({ emails })) as {
              users?: {
                id: number;
                email: string;
                firstName?: string | null;
                lastName?: string | null;
                photoUrl?: string | null;
              }[];
            };
            return result;
          }}
          isLookingUp={isLookingUp}
          onSubmit={handleSendInvitations}
          isSubmitting={isInviting}
        />
      )}

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
