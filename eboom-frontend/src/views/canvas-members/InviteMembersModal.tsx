"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InviteMembersForm } from "./InviteMembersForm";
import type { InviteSuggestion } from "@/src/hooks/useCanvasMembers";

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: InviteSuggestion[];
  isLoadingSuggestions?: boolean;
  onLookup: (emails: string[]) => Promise<{
    users?: {
      id: number;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      photoUrl?: string | null;
    }[];
  } | null>;
  onSubmit: (invitations: { email: string; role: string }[]) => Promise<void>;
  isLookingUp?: boolean;
  isSubmitting?: boolean;
}

export function InviteMembersModal({
  open,
  onOpenChange,
  suggestions,
  isLoadingSuggestions,
  onLookup,
  onSubmit,
  isLookingUp,
  isSubmitting,
}: InviteMembersModalProps) {
  const { t } = useTranslation("canvas-members");
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFormKey((key) => key + 1);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (invitations: { email: string; role: string }[]) => {
    await onSubmit(invitations);
    setFormKey((key) => key + 1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("members.inviteSection")}</DialogTitle>
          <DialogDescription>{t("members.inviteSectionDescription")}</DialogDescription>
        </DialogHeader>
        <InviteMembersForm
          key={formKey}
          suggestions={suggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          onLookup={async (emails) => {
            const result = await onLookup(emails);
            return {
              users: (result?.users ?? []).map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                photoUrl: user.photoUrl,
                role: "visitor",
              })),
            };
          }}
          isLookingUp={isLookingUp}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hideSectionTitle
        />
      </DialogContent>
    </Dialog>
  );
}
