export const EMAIL_COLORS = {
  brand: "#6D28D9",
  brandDark: "#5B21B6",
  brandLight: "#EDE9FE",
  background: "#F1F5F9",
  card: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",
  border: "#E2E8F0",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  warningBorder: "#FDE68A",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#059669",
  successBg: "#ECFDF5",
  successBorder: "#A7F3D0",
  info: "#2563EB",
  infoBg: "#EFF6FF",
  infoBorder: "#BFDBFE",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNotificationAmount(amount: string, symbol: string): string {
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return `${symbol}${amount}`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatNotificationDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function renderEmailButton(href: string, label: string, variant: "primary" | "danger" = "primary"): string {
  const background = variant === "danger" ? EMAIL_COLORS.danger : EMAIL_COLORS.brand;
  const backgroundDark = variant === "danger" ? "#B91C1C" : EMAIL_COLORS.brandDark;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
      <tr>
        <td style="border-radius: 10px; background-color: ${background};">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 10px; background-color: ${background};">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function renderLinkFallback(url: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 8px 0 24px;">
      <tr>
        <td style="padding: 14px 16px; background-color: ${EMAIL_COLORS.background}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px;">
          <p style="margin: 0 0 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: ${EMAIL_COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;">
            Or copy this link
          </p>
          <a href="${url}" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: ${EMAIL_COLORS.brand}; word-break: break-all; text-decoration: none;">
            ${escapeHtml(url)}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function renderCallout(
  message: string,
  tone: "info" | "warning" | "danger" | "success" = "info"
): string {
  const palette = {
    info: { bg: EMAIL_COLORS.infoBg, border: EMAIL_COLORS.infoBorder, accent: EMAIL_COLORS.info },
    warning: { bg: EMAIL_COLORS.warningBg, border: EMAIL_COLORS.warningBorder, accent: EMAIL_COLORS.warning },
    danger: { bg: EMAIL_COLORS.dangerBg, border: EMAIL_COLORS.dangerBorder, accent: EMAIL_COLORS.danger },
    success: { bg: EMAIL_COLORS.successBg, border: EMAIL_COLORS.successBorder, accent: EMAIL_COLORS.success },
  }[tone];

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="padding: 14px 16px; background-color: ${palette.bg}; border: 1px solid ${palette.border}; border-left: 4px solid ${palette.accent}; border-radius: 8px;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: ${EMAIL_COLORS.text};">
            ${message}
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}

export function renderNotificationItem(options: {
  title: string;
  meta: string;
  context: string;
  accentColor: string;
  accentBg: string;
}): string {
  const { title, meta, context, accentColor, accentBg } = options;

  return `
    <tr>
      <td style="padding: 0 0 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${EMAIL_COLORS.background}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 10px; overflow: hidden;">
          <tr>
            <td width="4" style="background-color: ${accentColor};"></td>
            <td style="padding: 16px 18px;">
              <p style="margin: 0 0 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: ${EMAIL_COLORS.text};">
                ${escapeHtml(title)}
              </p>
              <p style="margin: 0 0 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: ${EMAIL_COLORS.textMuted};">
                ${meta}
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: ${EMAIL_COLORS.textSubtle};">
                <span style="display: inline-block; padding: 2px 8px; background-color: ${accentBg}; border-radius: 999px; color: ${accentColor}; font-weight: 500;">
                  ${escapeHtml(context)}
                </span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `.trim();
}

export function renderSectionHeading(title: string, description?: string): string {
  const descriptionHtml = description
    ? `<p style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.textMuted};">${description}</p>`
    : "";

  return `
    <h2 style="margin: 32px 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.text};">
      ${escapeHtml(title)}
    </h2>
    ${descriptionHtml}
  `.trim();
}
