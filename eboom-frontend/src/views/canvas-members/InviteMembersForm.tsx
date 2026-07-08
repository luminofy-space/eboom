"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { MemberRoleSelect } from "./MemberRoleSelect";
import { displayName, MemberIdentity, UserAvatar } from "./UserAvatar";
import type { InviteSuggestion } from "@/src/hooks/useCanvasMembers";
import { Loader2, X } from "lucide-react";

type InviteDraft = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  role: string;
};

interface InviteMembersFormProps {
  suggestions: InviteSuggestion[];
  isLoadingSuggestions?: boolean;
  onLookup: (emails: string[]) => Promise<{ users: InviteDraft[] } | null>;
  onSubmit: (invitations: { email: string; role: string }[]) => Promise<void>;
  isLookingUp?: boolean;
  isSubmitting?: boolean;
  hideSectionTitle?: boolean;
}

export function InviteMembersForm({
  suggestions,
  isLoadingSuggestions = false,
  onLookup,
  onSubmit,
  isLookingUp = false,
  isSubmitting = false,
  hideSectionTitle = false,
}: InviteMembersFormProps) {
  const { t } = useTranslation("canvas-members");
  const anchor = useComboboxAnchor();
  const [emailInput, setEmailInput] = useState("");
  const [drafts, setDrafts] = useState<InviteDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const suggestionsById = useMemo(
    () => new Map(suggestions.map((user) => [String(user.id), user])),
    [suggestions]
  );

  const suggestionIdSet = useMemo(
    () => new Set(suggestions.map((user) => user.id)),
    [suggestions]
  );

  const itemIds = useMemo(() => suggestions.map((user) => String(user.id)), [suggestions]);

  const selectedIds = drafts
    .filter((draft) => suggestionIdSet.has(draft.id))
    .map((draft) => String(draft.id));

  const roleLabels = {
    "roles.collaborator": t("roles.collaborator"),
    "roles.modifier": t("roles.modifier"),
    "roles.visitor": t("roles.visitor"),
  };

  const addDraft = (user: InviteDraft) => {
    const email = user.email.toLowerCase();
    if (drafts.some((draft) => draft.email.toLowerCase() === email)) {
      setError(t("members.errors.alreadyAdded"));
      return false;
    }
    setDrafts((prev) => [...prev, { ...user, role: user.role || "visitor" }]);
    setError(null);
    return true;
  };

  const removeDraft = (email: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.email.toLowerCase() !== email.toLowerCase()));
    setError(null);
  };

  const handleSelectionChange = (values: string[]) => {
    setError(null);
    setDrafts((prev) => {
      const selectedSet = new Set(values);

      const kept = prev.filter((draft) => {
        if (!suggestionIdSet.has(draft.id)) return true;
        return selectedSet.has(String(draft.id));
      });

      for (const id of values) {
        const user = suggestionsById.get(id);
        if (!user) continue;
        if (kept.some((draft) => draft.email.toLowerCase() === user.email.toLowerCase())) continue;
        kept.push({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          role: "visitor",
        });
      }

      return kept;
    });
  };

  const addEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (drafts.some((draft) => draft.email.toLowerCase() === email)) {
      setError(t("members.errors.alreadyAdded"));
      return;
    }

    setError(null);
    try {
      const result = await onLookup([email]);
      const user = result?.users?.[0];
      if (!user) {
        setError(t("members.errors.userNotFound"));
        return;
      }

      if (addDraft({ ...user, role: "visitor" })) {
        setEmailInput("");
      }
    } catch {
      setError(t("members.errors.userNotFound"));
    }
  };

  const handleSubmit = async () => {
    if (drafts.length === 0) {
      setError(t("members.errors.emptyList"));
      return;
    }
    await onSubmit(drafts.map((draft) => ({ email: draft.email, role: draft.role })));
    setDrafts([]);
    setEmailInput("");
    setError(null);
  };

  const inputDisabled = isSubmitting || isLookingUp || isLoadingSuggestions;

  return (
    <Stack gap={4}>
      {!hideSectionTitle && (
        <Typography variant="title">{t("members.inviteSection")}</Typography>
      )}

      <Stack gap={2}>
        <Typography variant="muted-sm">{t("members.suggestionsHint")}</Typography>
        <Combobox
          multiple
          items={itemIds}
          value={selectedIds}
          onValueChange={(values) => handleSelectionChange(values ?? [])}
          disabled={inputDisabled}
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((id) => {
                    const user = suggestionsById.get(id);
                    const label = user ? displayName(user) : id;
                    return (
                      <ComboboxChip key={id} aria-label={label}>
                        {user ? (
                          <span className="flex items-center gap-1.5">
                            <UserAvatar
                              photoUrl={user.photoUrl}
                              firstName={user.firstName}
                              lastName={user.lastName}
                              email={user.email}
                              size="sm"
                            />
                            {label}
                          </span>
                        ) : (
                          label
                        )}
                      </ComboboxChip>
                    );
                  })}
                  <ComboboxChipsInput placeholder={t("members.selectMembersPlaceholder")} />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>{t("members.noSuggestions")}</ComboboxEmpty>
            <ComboboxList>
              <ComboboxCollection>
                {(id: string) => {
                  const user = suggestionsById.get(id);
                  if (!user) return null;
                  return (
                    <ComboboxItem key={id} value={id}>
                      <MemberIdentity
                        photoUrl={user.photoUrl}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        email={user.email}
                        avatarSize="sm"
                      />
                    </ComboboxItem>
                  );
                }}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Stack>

      <Stack gap={2}>
        <Typography variant="muted-sm">{t("members.emailHint")}</Typography>
        <Stack direction="row" gap={2} align="end">
          <Input
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setError(null);
            }}
            placeholder={t("members.emailPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmail();
              }
            }}
            disabled={inputDisabled}
          />
          <Button type="button" variant="secondary" onClick={addEmail} disabled={inputDisabled}>
            {isLookingUp && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("members.addEmail")}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Typography variant="muted-sm" className="text-destructive">
          {error}
        </Typography>
      )}

      {drafts.length > 0 && (
        <Stack gap={2}>
          {drafts.map((draft) => (
            <Stack
              key={draft.email}
              direction="row"
              align="center"
              gap={2}
              className="rounded-md border p-2"
            >
              <MemberIdentity
                photoUrl={draft.photoUrl}
                firstName={draft.firstName}
                lastName={draft.lastName}
                email={draft.email}
                avatarSize="sm"
                className="flex-1"
              />
              <MemberRoleSelect
                value={draft.role}
                onChange={(role) =>
                  setDrafts((prev) =>
                    prev.map((item) =>
                      item.email.toLowerCase() === draft.email.toLowerCase()
                        ? { ...item, role }
                        : item
                    )
                  )
                }
                labels={roleLabels}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeDraft(draft.email)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </Stack>
          ))}

          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("members.sendInvitations")}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
