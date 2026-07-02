"use client";

import { MoreVertical, Pencil, RotateCcw, Target, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { formatCurrency, formatDate } from "@/src/i18n/formatters";
import { BudgetProgressBar } from "./BudgetProgressBar";
import type { SavingsGoalProgress, SavingsGoalStatus } from "../types";

interface GoalCardProps {
  progress: SavingsGoalProgress;
  canEdit?: boolean;
  onEdit?: () => void;
  onStatusChange?: (status: SavingsGoalStatus) => void;
}

function statusBadgeVariant(status: SavingsGoalStatus): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "achieved") return "secondary";
  return "outline";
}

export function GoalCard({ progress, canEdit, onEdit, onStatusChange }: GoalCardProps) {
  const { t } = useTranslation("budget-planning");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const status = progress.status ?? "active";

  return (
    <TooltipProvider>
      <div className="relative rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/30">
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 size-8 text-muted-foreground"
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">{tc("actions.openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                {t("form.editGoal")}
              </DropdownMenuItem>
              {status === "active" && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange?.("achieved")}>
                    <Target className="size-4" />
                    {t("goals.actions.markAchieved")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange?.("dropped")}>
                    <XCircle className="size-4" />
                    {t("goals.actions.drop")}
                  </DropdownMenuItem>
                </>
              )}
              {status !== "active" && (
                <DropdownMenuItem onClick={() => onStatusChange?.("active")}>
                  <RotateCcw className="size-4" />
                  {t("goals.actions.reactivate")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-4 pr-8">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2">
                  <Typography variant="heading" className="line-clamp-2">
                    {progress.name}
                  </Typography>
                  <Badge variant={statusBadgeVariant(status)}>
                    {t(`goals.status.${status}`)}
                  </Badge>
                </div>
                {progress.targetDate && progress.daysRemaining != null && status === "active" && (
                  <Typography variant="caption" className="shrink-0">
                    {progress.daysRemaining >= 0
                      ? t("goals.daysLeft", { count: progress.daysRemaining })
                      : formatDate(progress.targetDate, { preset: "short", fallback: emDash })}
                  </Typography>
                )}
              </div>

              <BudgetProgressBar
                percent={Math.min(progress.percent, 100)}
                threshold={progress.alertThresholdPercent}
              />

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Typography variant="stat" className="text-lg">
                  {t("goals.progress", {
                    current: formatCurrency(progress.availableBalance, progress.currencySymbol, {
                      preset: "compact",
                    }),
                    target: formatCurrency(progress.targetAmount, progress.currencySymbol, {
                      preset: "compact",
                    }),
                  })}
                </Typography>
              </div>

              <Typography variant="muted-sm">{t("goals.availableAcrossWallets")}</Typography>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t("goals.shadowDisclaimer")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
