import { escapeAttribute, escapeHtml } from "../escape.ts";
import type { RichText, Theme } from "../types.ts";

/** `linkColor` replaces the theme link colour (a note keeps its own text colour, F4.9). */
export function renderRichText(theme: Theme, content: RichText, linkColor?: string): string {
  if (typeof content === "string") return escapeHtml(content);
  return content
    .map((inline) => {
      if (typeof inline === "string") return escapeHtml(inline);
      if ("bold" in inline)
        return `<strong style="font-weight:700;">${escapeHtml(inline.bold)}</strong>`;
      return `<a href="${escapeAttribute(inline.url)}" class="mk-link" style="color:${linkColor ?? theme.colors.link};text-decoration:underline;">${escapeHtml(inline.text)}</a>`;
    })
    .join("");
}
