"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Stack } from "@/components/ui/stack";
import { cn } from "@/lib/utils";
import type { OverdueNotification } from "@/src/hooks/useNotifications";

function formatAmount(amount: string, symbol: string): string {
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return `${symbol}${amount}`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDueDate(date: string, locale: string): string {
  return new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: OverdueNotification;
  onNavigate: () => void;
}) {
  const { t, i18n } = useTranslation("navigation");
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
          {formatAmount(notification.amount, notification.currencySymbol)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDueDate(notification.dueDate, i18n.language)}
          {" · "}
          {t("notifications.daysOverdue", { count: notification.daysOverdue })}
        </p>
        <p className="truncate text-xs text-muted-foreground">{notification.canvasName}</p>
      </div>
    </button>
  );
}

interface NotificationsPanelProps {
  notifications: OverdueNotification[];
  isLoading: boolean;
  onClose: () => void;
}

export function NotificationsPanel({
  notifications,
  isLoading,
  onClose,
}: NotificationsPanelProps) {
  const { t } = useTranslation("navigation");
  const router = useRouter();

  const handleNavigate = (notification: OverdueNotification) => {
    onClose();
    router.push(notification.type === "expense_payment" ? "/expenses" : "/incomes");
  };

  if (isLoading) {
    return (
      <Stack align="center" className="py-6">
        <Spinner />
      </Stack>
    );
  }

  if (notifications.length === 0) {
    return (
      <Typography variant="muted-sm" className="py-4 text-center">
        {t("notifications.empty")}
      </Typography>
    );
  }

  return (
    <Stack gap={1} className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={`${notification.type}-${notification.id}`}
          notification={notification}
          onNavigate={() => handleNavigate(notification)}
        />
      ))}
    </Stack>
  );
}
