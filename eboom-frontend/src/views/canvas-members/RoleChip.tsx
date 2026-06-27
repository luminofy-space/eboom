"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { roleNameToValue } from "./MemberRoleSelect";

const ROLE_CHIP_CLASS: Record<string, string> = {
  owner:
    "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  collaborator:
    "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
  modifier:
    "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  visitor:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

interface RoleChipProps {
  roleName?: string | null;
  label: string;
  className?: string;
}

export function RoleChip({ roleName, label, className }: RoleChipProps) {
  const value = roleNameToValue(roleName);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md font-medium",
        ROLE_CHIP_CLASS[value] ?? ROLE_CHIP_CLASS.visitor,
        className
      )}
    >
      {label}
    </Badge>
  );
}
