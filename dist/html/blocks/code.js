import { escapeAttribute, escapeHtml } from "../../escape.js";
import { MONO_STACK } from "../css.js";
function grouped(code, group) {
    if (group === 0)
        return code;
    const parts = [];
    for (let index = 0; index < code.length; index += group) {
        parts.push(code.slice(index, index + group));
    }
    return parts.join(" ");
}
function sizing(length) {
    if (length <= 12)
        return "font-size:30px;line-height:36px;letter-spacing:8px;";
    if (length <= 16)
        return "font-size:22px;line-height:28px;letter-spacing:4px;white-space:nowrap;";
    return "font-size:16px;line-height:22px;letter-spacing:2px;white-space:nowrap;";
}
export function renderCode(theme, block) {
    const shown = grouped(block.code, block.group ?? 0);
    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
  <td class="mk-code" align="center" aria-label="${escapeAttribute(block.code)}" bgcolor="${theme.colors.subtle}" style="background:${theme.colors.subtle};border-radius:12px;padding:18px 12px;font-family:${MONO_STACK};${sizing(shown.length)}font-weight:700;color:${theme.colors.text};">${escapeHtml(shown)}</td>
</tr></table>`;
}
