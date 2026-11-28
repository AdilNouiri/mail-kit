import { renderHtml } from "./html/index.ts";
import { textPart } from "./text.ts";
import { assertDefinedTheme } from "./theme.ts";
import type { MailContent, RenderedMail, Theme } from "./types.ts";

export function renderMail(theme: Theme, content: MailContent): RenderedMail {
  assertDefinedTheme(theme);
  // renderHtml runs first: it holds the content checks (ContentError) that textPart relies on.
  const html = renderHtml(theme, content);
  return { subject: content.subject, html, text: textPart(theme, content) };
}
