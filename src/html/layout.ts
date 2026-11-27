import { escapeAttribute, escapeHtml } from "../escape.ts";
import type { Theme } from "../types.ts";
import { cssValue } from "./css.ts";

export function preheader(text: string | undefined): string {
  if (!text) return "";
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(text)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>\n`;
}

export function banner(theme: Theme): string {
  const { logo, colors } = theme;
  const logoCell = logo
    ? `
    <td style="padding-right:12px;vertical-align:middle;"><img src="${escapeAttribute(logo.url)}" width="${logo.width}" height="${logo.height}" alt="" style="display:block;border:0;outline:none;width:${logo.width}px;height:${logo.height}px;"></td>`
    : "";
  return `
<tr><td class="mk-banner" bgcolor="${colors.brand}" style="background:${colors.brand};padding:28px 40px;border-radius:16px 16px 0 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${logoCell}
    <td class="mk-wordmark" style="vertical-align:middle;font-family:${cssValue(theme.fonts.display)};font-size:26px;line-height:30px;color:${colors.onBrand};letter-spacing:${theme.wordmarkSpacing}px;">${escapeHtml(theme.wordmark)}</td>
  </tr></table>
</td></tr>
<tr><td bgcolor="${colors.accent}" style="background:${colors.accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>`;
}

export function footer(theme: Theme, reason: string): string {
  const { colors, footer: content } = theme;
  const link = content.link
    ? ` · <a href="${escapeAttribute(content.link.url)}" style="color:${colors.footerText};text-decoration:underline;">${escapeHtml(content.link.label)}</a>`
    : "";
  return `
<tr><td class="mk-footer" style="padding:24px 40px 8px;font-family:${cssValue(theme.fonts.text)};font-size:12px;line-height:18px;color:${colors.footerText};text-align:center;">
  ${escapeHtml(reason)}<br>
  ${escapeHtml(content.legal)}${link}
</td></tr>`;
}
