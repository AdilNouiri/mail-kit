import { escapeAttribute, escapeHtml } from "../../escape.ts";
import type { CodeBlock, Theme } from "../../types.ts";
import { MONO_STACK } from "../css.ts";

function grouped(code: string, group: number): string {
  if (group === 0) return code;
  const parts: string[] = [];
  for (let index = 0; index < code.length; index += group) {
    parts.push(code.slice(index, index + group));
  }
  return parts.join(" ");
}

export function renderCode(theme: Theme, block: CodeBlock): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
  <td class="mk-code" align="center" aria-label="${escapeAttribute(block.code)}" bgcolor="${theme.colors.subtle}" style="background:${theme.colors.subtle};border-radius:12px;padding:18px 12px;font-family:${MONO_STACK};font-size:30px;line-height:36px;letter-spacing:8px;font-weight:700;color:${theme.colors.text};">${escapeHtml(grouped(block.code, block.group ?? 0))}</td>
</tr></table>`;
}
