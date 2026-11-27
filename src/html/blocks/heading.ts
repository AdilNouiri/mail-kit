import { escapeHtml } from "../../escape.ts";
import type { HeadingBlock, Theme } from "../../types.ts";
import { cssValue } from "../css.ts";

export function renderHeading(theme: Theme, block: HeadingBlock): string {
  return `<h1 class="mk-heading" style="margin:0 0 16px;font-family:${cssValue(theme.fonts.display)};font-weight:${theme.fonts.displayWeight};font-size:28px;line-height:34px;color:${theme.colors.text};">${escapeHtml(block.text)}</h1>`;
}
