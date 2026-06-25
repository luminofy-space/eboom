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
