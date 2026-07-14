import nodemailer from "nodemailer";
import type { OverdueNotification } from "../types/notifications";
import type { BudgetAlertNotification } from "../types/planning";
import {
  buildBudgetAlertsEmailSubject,
  buildOverdueEmailSubject,
  renderBudgetAlertsEmail,
  renderBudgetAlertsEmailText,
  renderOverdueNotificationsEmail,
  renderOverdueNotificationsEmailText,
  renderPasswordResetEmail,
  renderPasswordResetEmailText,
  renderVerificationEmail,
  renderVerificationEmailText,
} from "./emailTemplates";

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

  await sendEmail({
    to: email,
    subject: "Verify your email — Eboom",
    html: renderVerificationEmail(verificationUrl),
    text: renderVerificationEmailText(verificationUrl),
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your password — Eboom",
    html: renderPasswordResetEmail(resetUrl),
    text: renderPasswordResetEmailText(resetUrl),
  });
};

export const sendOverdueNotificationsEmail = async (
  email: string,
  firstName: string | null | undefined,
  notifications: OverdueNotification[]
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: buildOverdueEmailSubject(notifications.length),
    html: renderOverdueNotificationsEmail(firstName, notifications, APP_URL),
    text: renderOverdueNotificationsEmailText(firstName, notifications, APP_URL),
  });
};

export const sendBudgetAlertsEmail = async (
  email: string,
  firstName: string | null | undefined,
  alerts: BudgetAlertNotification[]
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: buildBudgetAlertsEmailSubject(alerts),
    html: renderBudgetAlertsEmail(firstName, alerts, APP_URL),
    text: renderBudgetAlertsEmailText(firstName, alerts, APP_URL),
  });
};
