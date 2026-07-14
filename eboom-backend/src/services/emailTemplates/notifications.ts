import type { OverdueNotification } from "../../types/notifications";
import type { BudgetAlertNotification } from "../../types/planning";
import { renderEmailLayout } from "./layout";
import {
  EMAIL_COLORS,
  escapeHtml,
  formatNotificationAmount,
  formatNotificationDate,
  renderEmailButton,
  renderNotificationItem,
  renderSectionHeading,
} from "./shared";

function renderOverdueItems(items: OverdueNotification[]): string {
  return items
    .map((item) => {
      const label = item.type === "expense_payment" ? "Payment overdue" : "Income not received";
      const meta = `${label} · ${formatNotificationAmount(item.amount, item.currencySymbol)} · Due ${formatNotificationDate(item.dueDate)} · ${item.daysOverdue} day${item.daysOverdue === 1 ? "" : "s"} overdue`;

      return renderNotificationItem({
        title: item.entityName,
        meta,
        context: item.canvasName,
        accentColor: EMAIL_COLORS.warning,
        accentBg: EMAIL_COLORS.warningBg,
      });
    })
    .join("");
}

function renderBudgetWarningItems(alerts: BudgetAlertNotification[]): string {
  return alerts
    .map((alert) => {
      const kind = alert.type === "budget_category" ? "Category budget" : "Monthly budget";
      const meta = `${kind} · ${alert.percent}% of ${alert.threshold}% threshold · ${formatNotificationAmount(alert.spent, alert.currencySymbol)}/${formatNotificationAmount(alert.limit, alert.currencySymbol)} ${alert.currencyCode}`;

      return renderNotificationItem({
        title: alert.label,
        meta,
        context: alert.canvasName,
        accentColor: EMAIL_COLORS.danger,
        accentBg: EMAIL_COLORS.dangerBg,
      });
    })
    .join("");
}

function renderGoalCelebrationItems(alerts: BudgetAlertNotification[]): string {
  return alerts
    .map((alert) => {
      const meta = `Your balance can cover this goal · ${formatNotificationAmount(alert.spent, alert.currencySymbol)} ${alert.currencyCode}`;

      return renderNotificationItem({
        title: `You can afford ${alert.label}!`,
        meta,
        context: alert.canvasName,
        accentColor: EMAIL_COLORS.success,
        accentBg: EMAIL_COLORS.successBg,
      });
    })
    .join("");
}

export function buildOverdueEmailSubject(count: number): string {
  return count === 1
    ? "You have 1 overdue payment or income entry"
    : `You have ${count} overdue payments or income entries`;
}

export function renderOverdueNotificationsEmail(
  firstName: string | null | undefined,
  notifications: OverdueNotification[],
  appUrl: string
): string {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const count = notifications.length;

  const body = `
    <p style="margin: 0 0 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #64748B;">
      ${greeting} The following planned payments or income entries are past their due date:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${renderOverdueItems(notifications)}
    </table>
    ${renderEmailButton(appUrl, "Open Eboom")}
    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #94A3B8;">
      You can also review these in the notifications panel inside the app.
    </p>
  `;

  return renderEmailLayout({
    preheader: `${count} overdue ${count === 1 ? "entry needs" : "entries need"} your attention.`,
    eyebrow: "Reminders",
    title: "Overdue items",
    body,
  });
}

export function renderOverdueNotificationsEmailText(
  firstName: string | null | undefined,
  notifications: OverdueNotification[],
  appUrl: string
): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const textLines = notifications.map((item) => {
    const label = item.type === "expense_payment" ? "Payment overdue" : "Income not received";
    return `- ${item.entityName}: ${label}, ${formatNotificationAmount(item.amount, item.currencySymbol)}, due ${formatNotificationDate(item.dueDate)} (${item.canvasName})`;
  });

  return `${greeting}\n\n${textLines.join("\n")}\n\nOpen Eboom: ${appUrl}`;
}

export function buildBudgetAlertsEmailSubject(alerts: BudgetAlertNotification[]): string {
  const budgetWarnings = alerts.filter((alert) => alert.type !== "savings_goal");
  const goalAlerts = alerts.filter((alert) => alert.type === "savings_goal");
  const count = alerts.length;

  if (budgetWarnings.length > 0 && goalAlerts.length === 0) {
    return budgetWarnings.length === 1
      ? `Budget warning: ${budgetWarnings[0].label} at ${Math.round(budgetWarnings[0].percent)}%`
      : `You have ${budgetWarnings.length} budget warnings`;
  }

  if (goalAlerts.length > 0 && budgetWarnings.length === 0) {
    return goalAlerts.length === 1
      ? `You can afford ${goalAlerts[0].label}!`
      : `You have ${goalAlerts.length} goals within reach`;
  }

  return `You have ${count} budget and goal updates`;
}

export function renderBudgetAlertsEmail(
  firstName: string | null | undefined,
  alerts: BudgetAlertNotification[],
  appUrl: string
): string {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const budgetWarnings = alerts.filter((alert) => alert.type !== "savings_goal");
  const goalAlerts = alerts.filter((alert) => alert.type === "savings_goal");

  const budgetSection =
    budgetWarnings.length > 0
      ? `
          ${renderSectionHeading("Budget warnings", "These monthly budgets have reached your warning threshold:")}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${renderBudgetWarningItems(budgetWarnings)}
          </table>
        `
      : "";

  const goalSection =
    goalAlerts.length > 0
      ? `
          ${renderSectionHeading("Goals within reach", "Good news — your wallet balances can cover these goals:")}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${renderGoalCelebrationItems(goalAlerts)}
          </table>
        `
      : "";

  const body = `
    <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #64748B;">
      ${greeting} Here's a summary of your latest budget and goal updates:
    </p>
    ${budgetSection}
    ${goalSection}
    ${renderEmailButton(`${appUrl}/budget-planning`, "Review budgets & goals")}
    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #94A3B8;">
      You can also review these in the notifications panel inside the app.
    </p>
  `;

  return renderEmailLayout({
    preheader: "Your latest budget warnings and savings goal updates.",
    eyebrow: "Updates",
    title: "Budget & goal updates",
    body,
  });
}

export function renderBudgetAlertsEmailText(
  firstName: string | null | undefined,
  alerts: BudgetAlertNotification[],
  appUrl: string
): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const budgetWarnings = alerts.filter((alert) => alert.type !== "savings_goal");
  const goalAlerts = alerts.filter((alert) => alert.type === "savings_goal");

  const textLines = [
    ...budgetWarnings.map((alert) => {
      const kind = alert.type === "budget_category" ? "Category budget" : "Monthly budget";
      return `- ${alert.label}: ${kind}, ${alert.percent}% (threshold ${alert.threshold}%), ${formatNotificationAmount(alert.spent, alert.currencySymbol)}/${formatNotificationAmount(alert.limit, alert.currencySymbol)} ${alert.currencyCode} (${alert.canvasName})`;
    }),
    ...goalAlerts.map(
      (alert) =>
        `- Congrats! Your balance can cover ${alert.label}. ${formatNotificationAmount(alert.spent, alert.currencySymbol)} ${alert.currencyCode} (${alert.canvasName})`
    ),
  ];

  return `${greeting}\n\n${textLines.join("\n")}\n\nReview budgets & goals: ${appUrl}/budget-planning`;
}
