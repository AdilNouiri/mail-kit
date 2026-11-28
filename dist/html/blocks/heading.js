import { escapeHtml } from "../../escape.js";
import { cssValue } from "../css.js";
export function renderHeading(theme, block) {
    return `<h1 class="mk-heading" style="margin:0 0 16px;font-family:${cssValue(theme.fonts.display)};font-weight:${theme.fonts.displayWeight};font-size:28px;line-height:34px;color:${theme.colors.text};">${escapeHtml(block.text)}</h1>`;
}
