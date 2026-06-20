"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "collaborator", labelKey: "roles.collaborator" },
  { value: "modifier", labelKey: "roles.modifier" },
  { value: "visitor", labelKey: "roles.visitor" },
] as const;

interface MemberRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  labels: Record<string, string>;
}

export function MemberRoleSelect({ value, onChange, disabled, labels }: MemberRoleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {labels[opt.labelKey] ?? opt.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function roleNameToValue(roleName?: string | null): string {
  if (!roleName) return "visitor";
  return roleName.toLowerCase();
}

export function roleLabelKey(roleName?: string | null): string {
  const value = roleNameToValue(roleName);
  return `roles.${value}`;
}
