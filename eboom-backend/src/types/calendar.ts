export interface CalendarEvent {
  id: number;
  type: "income" | "expense" | "transfer";
  entityId: number;
  entryId?: number;
  date: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "overdue";
  isPredicted: boolean;
  info?: string;
  secondaryAmount?: string;
  secondaryCurrency?: string;
}

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrencePatternInput {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
}
