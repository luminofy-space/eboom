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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { formatCurrency, formatDate } from "@/src/i18n/formatters";
import { BudgetProgressBar } from "./BudgetProgressBar";
import type { SavingsGoalProgress, SavingsGoalStatus } from "@/src/types/budget-planning";

interface GoalCardProps {
  progress: SavingsGoalProgress;
  canEdit?: boolean;
  onEdit?: () => void;
  onStatusChange?: (status: SavingsGoalStatus) => void;
}

function statusBadgeVariant(status: SavingsGoalStatus): "secondary" | "outline" {
  if (status === "achieved") return "secondary";
  return "outline";
}

export function GoalCard({ progress, canEdit, onEdit, onStatusChange }: GoalCardProps) {
  const { t } = useTranslation("budget-planning");
  const { t: tc } = useTranslation("common");
  const status = progress.status ?? "active";
  const percent = Math.min(progress.percent, 100);
  const isInactive = status === "achieved" || status === "dropped";

  return (
    <div className="relative rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/30">
      <div className="mb-3 flex items-start justify-between gap-2 pr-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Typography variant="heading" className="line-clamp-2">
            {progress.name}
          </Typography>
          <Badge variant={statusBadgeVariant(status)} className="shrink-0">
            {t(`goals.status.${status}`)}
          </Badge>
        </div>
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {progress.photoUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={progress.photoUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {progress.targetDate && (
        <Typography variant="muted-sm" className="mb-3">
          {t("goals.targetDateDisplay", {
            date: formatDate(progress.targetDate, {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              fallback: tc("empty.emDash"),
            }),
          })}
        </Typography>
      )}

      <div className="space-y-3">
        <Typography variant="stat" className="text-lg">
          {formatCurrency(progress.targetAmount, progress.currencySymbol, {
            preset: "compact",
          })}
        </Typography>

        {isInactive ? (
          canEdit && (
            <Button
              className="w-full"
              onClick={() => onStatusChange?.("active")}
            >
              <RotateCcw className="size-4" />
              {t("goals.actions.reactivate")}
            </Button>
          )
        ) : (
          <>
            <BudgetProgressBar
              percent={percent}
              variant="goal"
              showPercent
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Typography variant="muted-sm" className="w-fit cursor-default">
                  {t("goals.availableInWallets", {
                    amount: formatCurrency(progress.availableBalance, progress.currencySymbol, {
                      preset: "compact",
                    }),
                    count: progress.walletCount ?? 0,
                  })}
                </Typography>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{t("goals.shadowDisclaimer")}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
