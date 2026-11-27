import { escapeAttribute, escapeHtml } from "../../escape.ts";
import type { ButtonBlock, Theme } from "../../types.ts";
import { cssValue, fallbackStack } from "../css.ts";
import { FALLBACK_LEAD } from "../fallback-lead.ts";
import { renderLink } from "./link.ts";

const HEIGHT = 48;

// Outlook's Word engine ignores padding on <a>, so it gets a VML roundrect of a fixed size;
// the width is estimated from the label (16px semibold, about 9px per character).
function vmlButton(theme: Theme, block: ButtonBlock): string {
  const width = Math.ceil([...block.label].length * 9) + 56;
  const arcsize = Math.min(100, Math.round((theme.buttonRadius / (HEIGHT / 2)) * 100));
  return `<!--[if mso]>
<div style="margin:8px 0 24px;"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeAttribute(block.url)}" style="height:${HEIGHT}px;v-text-anchor:middle;width:${width}px;" arcsize="${arcsize}%" stroke="f" fillcolor="${theme.colors.accent}">
<w:anchorlock/>
<center style="color:${theme.colors.onAccent};font-family:${fallbackStack(theme, theme.fonts.text)};font-size:16px;font-weight:600;">${escapeHtml(block.label)}</center>
</v:roundrect></div>
<![endif]-->`;
}

export function renderButton(theme: Theme, block: ButtonBlock): string {
  const button = `
${vmlButton(theme, block)}
<!--[if !mso]><!-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
  <td bgcolor="${theme.colors.accent}" style="background:${theme.colors.accent};border-radius:${theme.buttonRadius}px;">
    <a href="${escapeAttribute(block.url)}" class="mk-button" style="display:inline-block;padding:14px 28px;font-family:${cssValue(theme.fonts.text)};font-size:16px;line-height:20px;font-weight:600;color:${theme.colors.onAccent};text-decoration:none;border-radius:${theme.buttonRadius}px;">${escapeHtml(block.label)}</a>
  </td>
</tr></table>
<!--<![endif]-->`;
  if (block.fallback === false) return button;
  return `${button}\n${renderLink(theme, { lead: FALLBACK_LEAD[theme.lang], url: block.url })}`;
}
