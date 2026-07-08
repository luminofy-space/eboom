import { and, eq, inArray, isNotNull, isNull, like, lt } from "drizzle-orm";
import { db } from "../db/client";
import {
  canvasMembers,
  canvases,
  currencies,
  expensePayments,
  expenses,
  incomeEntries,
  incomes,
  notifications,
  userSettings,
  users,
} from "../db/schema";
import { sendBudgetAlertsEmail, sendOverdueNotificationsEmail } from "./emailService";
import {
  budgetAlertSourceKey,
  getBudgetAlertsForUser,
} from "./planningService";
import type { OverdueNotification } from "../types/notifications";
import type { BudgetAlertNotification } from "../types/planning";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

export async function getOverdueNotifications(userId: number): Promise<OverdueNotification[]> {
  const today = startOfDay(new Date());

  const memberships = await db
    .select({ canvasId: canvasMembers.canvasId })
    .from(canvasMembers)
    .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
    .where(and(eq(canvasMembers.userId, userId), eq(canvases.isArchived, false)));

  const canvasIds = memberships.map((m) => m.canvasId);
  if (canvasIds.length === 0) return [];

  const [overdueExpensePayments, overdueIncomeEntries] = await Promise.all([
    db
      .select({
        id: expensePayments.id,
        entityId: expenses.id,
        entityName: expenses.name,
        canvasId: expenses.canvasId,
        canvasName: canvases.name,
        amount: expensePayments.amount,
        dueDate: expensePayments.dueDate,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
      })
      .from(expensePayments)
      .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
      .innerJoin(canvases, eq(expenses.canvasId, canvases.id))
      .innerJoin(currencies, eq(expenses.currencyId, currencies.id))
      .where(
        and(
          inArray(expenses.canvasId, canvasIds),
          eq(expenses.isArchived, false),
          isNull(expensePayments.paidDate),
          isNotNull(expensePayments.dueDate),
          lt(expensePayments.dueDate, today)
        )
      ),
    db
      .select({
        id: incomeEntries.id,
        entityId: incomes.id,
        entityName: incomes.name,
        canvasId: incomes.canvasId,
        canvasName: canvases.name,
        amount: incomeEntries.amount,
        dueDate: incomeEntries.expectedDate,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
      })
      .from(incomeEntries)
      .innerJoin(incomes, eq(incomeEntries.incomeId, incomes.id))
      .innerJoin(canvases, eq(incomes.canvasId, canvases.id))
      .innerJoin(currencies, eq(incomes.currencyId, currencies.id))
      .where(
        and(
          inArray(incomes.canvasId, canvasIds),
          eq(incomes.isArchived, false),
          isNull(incomeEntries.receivedDate),
          isNotNull(incomeEntries.expectedDate),
          lt(incomeEntries.expectedDate, today)
        )
      ),
  ]);

  const notifications: OverdueNotification[] = [
    ...overdueExpensePayments.map((row) => ({
      id: row.id,
      type: "expense_payment" as const,
      canvasId: row.canvasId,
      canvasName: row.canvasName,
      entityId: row.entityId,
      entityName: row.entityName,
      amount: String(row.amount),
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      dueDate: new Date(row.dueDate!).toISOString(),
      daysOverdue: daysBetween(new Date(row.dueDate!), today),
    })),
    ...overdueIncomeEntries.map((row) => ({
      id: row.id,
      type: "income_entry" as const,
      canvasId: row.canvasId,
      canvasName: row.canvasName,
      entityId: row.entityId,
      entityName: row.entityName,
      amount: String(row.amount),
      currencyCode: row.currencyCode,
      currencySymbol: row.currencySymbol,
      dueDate: new Date(row.dueDate!).toISOString(),
      daysOverdue: daysBetween(new Date(row.dueDate!), today),
    })),
  ];

  return notifications.sort((a, b) => {
    const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.entityName.localeCompare(b.entityName);
  });
}

export function notificationSourceKey(notification: Pick<OverdueNotification, "type" | "id">): string {
  return `overdue:${notification.type}:${notification.id}`;
}

function formatNotificationMessage(notification: OverdueNotification): string {
  const label =
    notification.type === "expense_payment" ? "Payment overdue" : "Income not received";
  return `${label}: ${notification.entityName} (${notification.canvasName})`;
}

async function getExistingNotificationKeys(userId: number, prefix: string): Promise<Set<string>> {
  const rows = await db
    .select({ title: notifications.title })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), like(notifications.title, `${prefix}%`)));

  return new Set(rows.map((row) => row.title));
}

async function getExistingOverdueNotificationKeys(userId: number): Promise<Set<string>> {
  return getExistingNotificationKeys(userId, "overdue:");
}

async function getExistingBudgetNotificationKeys(userId: number): Promise<Set<string>> {
  return getExistingNotificationKeys(userId, "budget:");
}

function formatBudgetAlertMessage(alert: BudgetAlertNotification): string {
  if (alert.type === "savings_goal") {
    return `Savings goal progress: ${alert.label} (${alert.percent}% of ${alert.limit} ${alert.currencyCode}) — ${alert.canvasName}`;
  }
  return `Budget alert: ${alert.label} at ${alert.percent}% (${alert.spent}/${alert.limit} ${alert.currencyCode}) — ${alert.canvasName}`;
}

export async function deliverBudgetAlertNotificationsForUser(
  userId: number
): Promise<number> {
  const alerts = await getBudgetAlertsForUser(userId);
  if (alerts.length === 0) return 0;

  const existingKeys = await getExistingBudgetNotificationKeys(userId);
  const newAlerts = alerts.filter((alert) => !existingKeys.has(budgetAlertSourceKey(alert)));
  if (newAlerts.length === 0) return 0;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (user?.emailVerified && (await userWantsNotificationEmails(userId))) {
    await sendBudgetAlertsEmail(user.email, user.firstName, newAlerts);
  }

  await db.insert(notifications).values(
    newAlerts.map((alert) => ({
      userId,
      title: budgetAlertSourceKey(alert),
      message: formatBudgetAlertMessage(alert),
      isRead: false,
    }))
  );

  return newAlerts.length;
}

export async function getBudgetAlertNotifications(userId: number): Promise<BudgetAlertNotification[]> {
  return getBudgetAlertsForUser(userId);
}

async function userWantsNotificationEmails(userId: number): Promise<boolean> {
  const [settings] = await db
    .select({ notificationEnabled: userSettings.notificationEnabled })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  return settings?.notificationEnabled !== false;
}

export async function deliverOverdueNotificationEmailsForUser(
  userId: number
): Promise<number> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.emailVerified) return 0;
  if (!(await userWantsNotificationEmails(userId))) return 0;

  const overdueItems = await getOverdueNotifications(userId);
  if (overdueItems.length === 0) return 0;

  const existingKeys = await getExistingOverdueNotificationKeys(userId);
  const newItems = overdueItems.filter(
    (item) => !existingKeys.has(notificationSourceKey(item))
  );

  if (newItems.length === 0) return 0;

  await sendOverdueNotificationsEmail(user.email, user.firstName, newItems);

  await db.insert(notifications).values(
    newItems.map((item) => ({
      userId,
      title: notificationSourceKey(item),
      message: formatNotificationMessage(item),
      isRead: false,
    }))
  );

  return newItems.length;
}

export async function deliverOverdueNotificationEmailsForAllUsers(): Promise<void> {
  const members = await db
    .selectDistinct({ userId: canvasMembers.userId })
    .from(canvasMembers)
    .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
    .where(eq(canvases.isArchived, false));

  let sentCount = 0;

  for (const { userId } of members) {
    try {
      sentCount += await deliverOverdueNotificationEmailsForUser(userId);
    } catch (err) {
      console.error(`Failed to deliver overdue notification emails for user ${userId}:`, err);
    }
  }

  if (sentCount > 0) {
    console.log(`Sent overdue notification emails for ${sentCount} new item(s)`);
  }
}
