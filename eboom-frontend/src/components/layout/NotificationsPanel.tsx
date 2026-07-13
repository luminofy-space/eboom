"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BanknoteArrowDown, BanknoteArrowUp, PartyPopper, PiggyBank } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Stack } from "@/components/ui/stack";
import { IllustratedState } from "@/src/components/IllustratedState";
import { cn } from "@/lib/utils";
import type { OverdueNotification } from "@/src/hooks/useNotifications";
import type { BudgetAlertNotification } from "@/src/types/budget-planning";
import { formatCurrency, formatDate } from "@/src/i18n/formatters";

function OverdueNotificationItem({
  notification,
  onNavigate,
}: {
  notification: OverdueNotification;
  onNavigate: () => void;
}) {
  const { t } = useTranslation("navigation");
  const { t: tc } = useTranslation("common");
  const isExpense = notification.type === "expense_payment";
  const Icon = isExpense ? BanknoteArrowDown : BanknoteArrowUp;

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-start gap-3 rounded-md p-2 text-start transition-colors",
        "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          isExpense ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{notification.entityName}</p>
        <p className="text-xs text-muted-foreground">
          {isExpense
            ? t("notifications.overdueExpense")
            : t("notifications.overdueIncome")}
          {" · "}
          {formatCurrency(notification.amount, notification.currencySymbol, {
            preset: "compact",
          })}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(notification.dueDate, {
            preset: "short",
            fallback: tc("empty.emDash"),
          })}
          {" · "}
          {t("notifications.daysOverdue", { count: notification.daysOverdue })}
        </p>
        <p className="truncate text-xs text-muted-foreground">{notification.canvasName}</p>
      </div>
    </button>
  );
}

function BudgetAlertItem({
  alert,
  onNavigate,
}: {
  alert: BudgetAlertNotification;
  onNavigate: () => void;
}) {
  const { t } = useTranslation("navigation");

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-start gap-3 rounded-md p-2 text-start transition-colors",
        "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <PiggyBank className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{alert.label}</p>
        <p className="text-xs text-muted-foreground">
          {t("notifications.budgetAlert", {
            percent: Math.round(alert.percent),
            threshold: alert.threshold,
          })}
          {" · "}
          {formatCurrency(alert.spent, alert.currencySymbol, { preset: "compact" })}
          {" / "}
          {formatCurrency(alert.limit, alert.currencySymbol, { preset: "compact" })}
          {" "}
          {alert.currencyCode}
        </p>
        <p className="truncate text-xs text-muted-foreground">{alert.canvasName}</p>
      </div>
    </button>
  );
}

function GoalAlertItem({
  alert,
  onNavigate,
}: {
  alert: BudgetAlertNotification;
  onNavigate: () => void;
}) {
  const { t } = useTranslation("navigation");

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-start gap-3 rounded-md p-2 text-start transition-colors",
        "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <PartyPopper className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">
          {t("notifications.goalAchievable", { goalName: alert.label })}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatCurrency(alert.spent, alert.currencySymbol, { preset: "compact" })}
          {" · "}
          {alert.currencyCode}
        </p>
        <p className="truncate text-xs text-muted-foreground">{alert.canvasName}</p>
      </div>
    </button>
  );
}

interface NotificationsPanelProps {
  notifications: OverdueNotification[];
  budgetAlerts: BudgetAlertNotification[];
  isLoading: boolean;
  onClose: () => void;
}

export function NotificationsPanel({
  notifications,
  budgetAlerts,
  isLoading,
  onClose,
}: NotificationsPanelProps) {
  const { t } = useTranslation("navigation");
  const router = useRouter();

  const budgetWarnings = budgetAlerts.filter((alert) => alert.type !== "savings_goal");
  const goalAlerts = budgetAlerts.filter((alert) => alert.type === "savings_goal");
  const hasMultipleSections =
    [notifications.length > 0, budgetWarnings.length > 0, goalAlerts.length > 0].filter(Boolean)
      .length > 1;

  const handleOverdueNavigate = (notification: OverdueNotification) => {
    onClose();
    router.push(notification.type === "expense_payment" ? "/expenses" : "/incomes");
  };

  const handleBudgetNavigate = () => {
    onClose();
    router.push("/budget-planning");
  };

  if (isLoading) {
    return (
      <Stack align="center" className="py-6">
        <Spinner />
      </Stack>
    );
  }

  if (notifications.length === 0 && budgetAlerts.length === 0) {
    return (
      <IllustratedState
        illustration="noNotifications"
        density="compact"
        size="xs"
        fill={false}
        title={t("notifications.empty")}
        className="py-3"
      />
    );
  }

  return (
    <Stack gap={3} className="max-h-80 overflow-y-auto">
      {notifications.length > 0 && (
        <Stack gap={1}>
          {hasMultipleSections && (
            <Typography variant="muted-sm" className="px-2 font-medium">
              {t("notifications.overdueSection")}
            </Typography>
          )}
          {notifications.map((notification) => (
            <OverdueNotificationItem
              key={`${notification.type}-${notification.id}`}
              notification={notification}
              onNavigate={() => handleOverdueNavigate(notification)}
            />
          ))}
        </Stack>
      )}

      {budgetWarnings.length > 0 && (
        <Stack gap={1}>
          {hasMultipleSections && (
            <Typography variant="muted-sm" className="px-2 font-medium">
              {t("notifications.budgetSection")}
            </Typography>
          )}
          {budgetWarnings.map((alert) => (
            <BudgetAlertItem
              key={`${alert.type}-${alert.budgetId ?? alert.lineId}-${alert.periodKey}`}
              alert={alert}
              onNavigate={handleBudgetNavigate}
            />
          ))}
        </Stack>
      )}

      {goalAlerts.length > 0 && (
        <Stack gap={1}>
          {hasMultipleSections && (
            <Typography variant="muted-sm" className="px-2 font-medium">
              {t("notifications.goalSection")}
            </Typography>
          )}
          {goalAlerts.map((alert) => (
            <GoalAlertItem
              key={`${alert.type}-${alert.goalId}-${alert.periodKey}`}
              alert={alert}
              onNavigate={handleBudgetNavigate}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
