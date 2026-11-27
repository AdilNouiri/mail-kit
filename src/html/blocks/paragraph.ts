import type { ParagraphBlock, Theme } from "../../types.ts";
import { cssValue } from "../css.ts";
import { renderRichText } from "../rich-text.ts";

export function renderParagraph(theme: Theme, block: ParagraphBlock): string {
  return `<p class="mk-text" style="margin:0 0 16px;font-family:${cssValue(theme.fonts.text)};font-size:16px;line-height:24px;color:${theme.colors.textSoft};">${renderRichText(theme, block.content)}</p>`;
}
