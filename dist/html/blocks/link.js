import { escapeAttribute, escapeHtml } from "../../escape.js";
import { cssValue } from "../css.js";
export function renderLink(theme, block) {
    return `<p class="mk-small" style="margin:0 0 24px;font-family:${cssValue(theme.fonts.text)};font-size:13px;line-height:20px;color:${theme.colors.muted};">${escapeHtml(block.lead)}<br><a href="${escapeAttribute(block.url)}" class="mk-link" style="color:${theme.colors.link};word-break:break-all;">${escapeHtml(block.url)}</a></p>`;
}
