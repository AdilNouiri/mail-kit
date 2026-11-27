import type { NoteBlock, Theme } from "../../types.ts";
import { cssValue } from "../css.ts";
import { renderRichText } from "../rich-text.ts";

export function renderNote(theme: Theme, block: NoteBlock): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;"><tr>
  <td class="mk-note" bgcolor="${theme.colors.subtle}" style="background:${theme.colors.subtle};border-left:3px solid ${theme.colors.accent};border-radius:0 8px 8px 0;padding:12px 16px;font-family:${cssValue(theme.fonts.text)};font-size:14px;line-height:21px;color:${theme.colors.textSoft};">${renderRichText(theme, block.content)}</td>
</tr></table>`;
}
