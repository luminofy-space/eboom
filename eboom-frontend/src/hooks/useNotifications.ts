"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";

export type OverdueNotificationType = "expense_payment" | "income_entry";

export interface OverdueNotification {
  id: number;
  type: OverdueNotificationType;
  canvasId: number;
  canvasName: string;
  entityId: number;
  entityName: string;
  amount: string;
  currencyCode: string;
  currencySymbol: string;
  dueDate: string;
  daysOverdue: number;
}

interface NotificationsResponse {
  notifications: OverdueNotification[];
}

export function useNotifications() {
  const { data, isLoading, refetch } = useQueryApi<NotificationsResponse>(
    API_ROUTES.NOTIFICATIONS_OVERDUE,
    {
      queryKey: ["notifications", "overdue"],
      hasToken: true,
      refetchInterval: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  const notifications = data?.notifications ?? [];
  const overdueCount = notifications.length;

  return {
    notifications,
    overdueCount,
    isLoading,
    refetch,
  };
}
