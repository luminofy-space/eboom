import nodemailer from "nodemailer";
import type { OverdueNotification } from "../types/notifications";
import type { BudgetAlertNotification } from "../types/planning";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587", 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s/g, "");
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  requireTLS: EMAIL_PORT === 587,
  auth:
    EMAIL_USER && EMAIL_PASS
      ? {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        }
      : undefined,
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
});

if (EMAIL_USER && EMAIL_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter verification failed:", error);
    } else {
      console.log("Email transporter is ready");
    }
  });
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Email credentials are not configured");
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
    text: `Please verify your email by visiting: ${verificationUrl}`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #c82333; }
          .warning { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p class="warning">This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
};

function formatNotificationAmount(amount: string, symbol: string): string {
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return `${symbol}${amount}`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNotificationDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderNotificationItems(items: OverdueNotification[]): string {
  return items
    .map((item) => {
      const label =
        item.type === "expense_payment" ? "Payment overdue" : "Income not received";
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${item.entityName}</strong><br />
            <span style="color: #666; font-size: 14px;">
              ${label} · ${formatNotificationAmount(item.amount, item.currencySymbol)}
              · Due ${formatNotificationDate(item.dueDate)}
              · ${item.daysOverdue} day${item.daysOverdue === 1 ? "" : "s"} overdue
            </span><br />
            <span style="color: #999; font-size: 13px;">${item.canvasName}</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

export const sendOverdueNotificationsEmail = async (
  email: string,
  firstName: string | null | undefined,
  notifications: OverdueNotification[]
): Promise<void> => {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const count = notifications.length;
  const subject =
    count === 1
      ? "You have 1 overdue payment or income entry"
      : `You have ${count} overdue payments or income entries`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Overdue reminders</h2>
          <p>${greeting}</p>
          <p>The following planned payments or income entries are past their due date:</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${renderNotificationItems(notifications)}
          </table>
          <a href="${APP_URL}" class="button">Open Eboom</a>
          <p style="color: #666; font-size: 14px;">
            You can review these in the notifications panel inside the app.
          </p>
        </div>
      </body>
    </html>
  `;

  const textLines = notifications.map((item) => {
    const label =
      item.type === "expense_payment" ? "Payment overdue" : "Income not received";
    return `- ${item.entityName}: ${label}, ${formatNotificationAmount(item.amount, item.currencySymbol)}, due ${formatNotificationDate(item.dueDate)} (${item.canvasName})`;
  });

  await sendEmail({
    to: email,
    subject,
    html,
    text: `${greeting}\n\n${textLines.join("\n")}\n\nOpen Eboom: ${APP_URL}`,
  });
};

function renderBudgetWarningItems(alerts: BudgetAlertNotification[]): string {
  return alerts
    .map((alert) => {
      const kind = alert.type === "budget_category" ? "Category budget" : "Monthly budget";
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${alert.label}</strong><br />
            <span style="color: #666; font-size: 14px;">
              ${kind} · ${alert.percent}% of ${alert.threshold}% threshold
              · ${formatNotificationAmount(alert.spent, alert.currencySymbol)}/${formatNotificationAmount(alert.limit, alert.currencySymbol)} ${alert.currencyCode}
            </span><br />
            <span style="color: #999; font-size: 13px;">${alert.canvasName}</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderGoalCelebrationItems(alerts: BudgetAlertNotification[]): string {
  return alerts
    .map(
      (alert) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>Congrats!</strong><br />
            <span style="color: #666; font-size: 14px;">
              Your balance across all wallets can cover ${alert.label}.
              · ${formatNotificationAmount(alert.spent, alert.currencySymbol)} ${alert.currencyCode}
            </span><br />
            <span style="color: #999; font-size: 13px;">${alert.canvasName}</span>
          </td>
        </tr>
      `
    )
    .join("");
}

export const sendBudgetAlertsEmail = async (
  email: string,
  firstName: string | null | undefined,
  alerts: BudgetAlertNotification[]
): Promise<void> => {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const budgetWarnings = alerts.filter((alert) => alert.type !== "savings_goal");
  const goalAlerts = alerts.filter((alert) => alert.type === "savings_goal");
  const count = alerts.length;

  let subject: string;
  if (budgetWarnings.length > 0 && goalAlerts.length === 0) {
    subject =
      budgetWarnings.length === 1
        ? `Budget warning: ${budgetWarnings[0].label} at ${Math.round(budgetWarnings[0].percent)}%`
        : `You have ${budgetWarnings.length} budget warnings`;
  } else if (goalAlerts.length > 0 && budgetWarnings.length === 0) {
    subject =
      goalAlerts.length === 1
        ? `You can afford ${goalAlerts[0].label}!`
        : `You have ${goalAlerts.length} goals within reach`;
  } else {
    subject = `You have ${count} budget and goal updates`;
  }

  const budgetSection =
    budgetWarnings.length > 0
      ? `
          <h3 style="margin: 24px 0 8px;">Budget warnings</h3>
          <p>The following monthly budgets have reached your warning threshold:</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${renderBudgetWarningItems(budgetWarnings)}
          </table>
        `
      : "";

  const goalSection =
    goalAlerts.length > 0
      ? `
          <h3 style="margin: 24px 0 8px;">Goals</h3>
          <p>Good news — your wallet balances can cover these goals:</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${renderGoalCelebrationItems(goalAlerts)}
          </table>
        `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Updates from Eboom</h2>
          <p>${greeting}</p>
          ${budgetSection}
          ${goalSection}
          <a href="${APP_URL}/budget-planning" class="button">Review budgets & goals</a>
          <p style="color: #666; font-size: 14px;">
            You can review these in the notifications panel inside the app.
          </p>
        </div>
      </body>
    </html>
  `;

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

  await sendEmail({
    to: email,
    subject,
    html,
    text: `${greeting}\n\n${textLines.join("\n")}\n\nReview budgets & goals: ${APP_URL}/budget-planning`,
  });
};

