import { renderEmailLayout } from "./layout";
import { renderCallout, renderEmailButton, renderLinkFallback } from "./shared";

export function renderPasswordResetEmail(resetUrl: string): string {
  const body = `
    <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #64748B;">
      We received a request to reset the password for your Eboom account. Click the button below to choose a new password.
    </p>
    ${renderEmailButton(resetUrl, "Reset password", "danger")}
    ${renderLinkFallback(resetUrl)}
    ${renderCallout("<strong>This link expires in 1 hour.</strong> If you didn't request a password reset, no action is needed — your password will stay the same.", "warning")}
  `;

  return renderEmailLayout({
    preheader: "Reset your Eboom password. This link expires in 1 hour.",
    eyebrow: "Security",
    title: "Reset your password",
    body,
    footerNote: "If you didn't request this, someone may have entered your email by mistake.",
  });
}

export function renderPasswordResetEmailText(resetUrl: string): string {
  return `Reset your Eboom password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`;
}
