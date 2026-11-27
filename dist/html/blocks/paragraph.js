import { cssValue } from "../css.js";
import { renderRichText } from "../rich-text.js";
export function renderParagraph(theme, block) {
    return `<p class="mk-text" style="margin:0 0 16px;font-family:${cssValue(theme.fonts.text)};font-size:16px;line-height:24px;color:${theme.colors.textSoft};">${renderRichText(theme, block.content)}</p>`;
}
