import { renderHtml } from "./html/index.ts";
import { textPart } from "./text.ts";
import { assertDefinedTheme } from "./theme.ts";
import { ContentError, type MailContent, type RenderedMail, type Theme } from "./types.ts";

const MAX_HTML_BYTES = 100_000;

export function renderMail(theme: Theme, content: MailContent): RenderedMail {
  assertDefinedTheme(theme);
  // renderHtml runs first: it holds the content checks (ContentError) that textPart relies on.
  const html = renderHtml(theme, content);
  const bytes = new TextEncoder().encode(html).length;
  if (bytes > MAX_HTML_BYTES) {
    throw new ContentError(
      "html",
      `The html is ${bytes} bytes; the limit is ${MAX_HTML_BYTES} (Gmail clips at 102 KB).`,
    );
  }
  return { subject: content.subject, html, text: textPart(theme, content) };
}
