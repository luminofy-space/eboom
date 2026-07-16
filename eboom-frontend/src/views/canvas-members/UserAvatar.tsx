"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type UserIdentityFields = {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
};

export function getInitials({
  firstName,
  lastName,
  email,
}: Pick<UserIdentityFields, "firstName" | "lastName" | "email">) {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  if (first || last) return (first + last).toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

export function displayName(user: UserIdentityFields) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

interface UserAvatarProps extends UserIdentityFields {
  size?: "sm" | "default" | "lg";
  className?: string;
  square?: boolean;
}

export function UserAvatar({
  photoUrl,
  firstName,
  lastName,
  email,
  size = "default",
  className,
  square = false,
}: UserAvatarProps) {
  const initials = getInitials({ firstName, lastName, email });
  const rounding = square ? "rounded-lg" : "rounded-full";

  return (
    <Avatar size={size} className={cn(rounding, className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt={displayName({ firstName, lastName, email })} /> : null}
      <AvatarFallback className={rounding}>{initials}</AvatarFallback>
    </Avatar>
  );
}

interface MemberIdentityProps extends UserIdentityFields {
  avatarSize?: "sm" | "default" | "lg";
  className?: string;
}

export function MemberIdentity({
  photoUrl,
  firstName,
  lastName,
  email,
  avatarSize = "default",
  className,
}: MemberIdentityProps) {
  const name = displayName({ firstName, lastName, email });

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <UserAvatar
        photoUrl={photoUrl}
        firstName={firstName}
        lastName={lastName}
        email={email}
        size={avatarSize}
      />
      <Stack className="min-w-0" gap={1}>
        <Typography variant="muted-sm" className="font-medium truncate">
          {name}
        </Typography>
        <Typography variant="muted-sm" className="truncate">
          {email}
        </Typography>
      </Stack>
    </div>
  );
}
