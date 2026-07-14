import { EMAIL_COLORS, escapeHtml } from "./shared";

export interface EmailLayoutOptions {
  preheader?: string;
  title: string;
  eyebrow?: string;
  body: string;
  footerNote?: string;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const { preheader, title, eyebrow, body, footerNote } = options;
  const year = new Date().getFullYear();

  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preheader)}</div>`
    : "";

  const eyebrowHtml = eyebrow
    ? `<p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.brand};">
        ${escapeHtml(eyebrow)}
      </p>`
    : "";

  const footerNoteHtml = footerNote
    ? `<p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: ${EMAIL_COLORS.textSubtle};">
        ${footerNote}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.background}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    ${preheaderHtml}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${EMAIL_COLORS.background};">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px;">
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, ${EMAIL_COLORS.brand} 0%, ${EMAIL_COLORS.brandDark} 100%); text-align: center; vertical-align: middle;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; line-height: 36px;">E</span>
                    </td>
                    <td style="padding-left: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.text}; letter-spacing: -0.02em;">
                      Eboom
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: ${EMAIL_COLORS.card}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="height: 4px; background: linear-gradient(90deg, ${EMAIL_COLORS.brand} 0%, #8B5CF6 50%, ${EMAIL_COLORS.brandDark} 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding: 36px 32px 32px;">
                      ${eyebrowHtml}
                      <h1 style="margin: 0 0 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 700; line-height: 1.25; color: ${EMAIL_COLORS.text}; letter-spacing: -0.02em;">
                        ${escapeHtml(title)}
                      </h1>
                      ${body}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 28px 8px 0;">
                ${footerNoteHtml}
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: ${EMAIL_COLORS.textSubtle};">
                  &copy; ${year} Eboom. Personal finance, simplified.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
