import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { buildUrlWithParams } from "@/src/api/buildUrlWithParams";

export interface CalendarEvent {
  id: number;
  type: "income" | "expense";
  entityId: number;
  entryId?: number;
  date: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "overdue";
  isPredicted: boolean;
  info?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
}

export function useCalendarData(canvasId: number | null, start: Date, end: Date) {
  const url =
    canvasId != null
      ? buildUrlWithParams(API_ROUTES.CALENDAR_EVENTS(canvasId), {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        })
      : "";

  const { data, error, isLoading, refetch } = useQueryApi<CalendarResponse>(url, {
    queryKey: ["calendar", canvasId, start.toISOString(), end.toISOString()],
    enabled: canvasId != null,
    hasToken: true,
  });

  return {
    events: data?.events ?? [],
    error,
    isLoading,
    refetch,
  };
}
