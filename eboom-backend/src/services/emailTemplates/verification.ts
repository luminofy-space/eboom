import { renderEmailLayout } from "./layout";
import { renderCallout, renderEmailButton, renderLinkFallback } from "./shared";

export function renderVerificationEmail(verificationUrl: string): string {
  const body = `
    <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #64748B;">
      Thanks for signing up! Confirm your email address to activate your account and start managing your finances.
    </p>
    ${renderEmailButton(verificationUrl, "Verify email address")}
    ${renderLinkFallback(verificationUrl)}
    ${renderCallout("<strong>This link expires in 24 hours.</strong> If you didn't create an Eboom account, you can safely ignore this email.", "info")}
  `;

  return renderEmailLayout({
    preheader: "Confirm your email to get started with Eboom.",
    eyebrow: "Account setup",
    title: "Verify your email",
    body,
    footerNote: "You're receiving this because someone signed up with your email address.",
  });
}

export function renderVerificationEmailText(verificationUrl: string): string {
  return `Verify your Eboom email address by visiting:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`;
}
