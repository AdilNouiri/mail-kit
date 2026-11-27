import { renderHtml } from "./html/index.ts";
import { renderText } from "./text.ts";
import type { MailContent, RenderedMail, Theme } from "./types.ts";

export function renderMail(theme: Theme, content: MailContent): RenderedMail {
  // renderHtml runs first: it holds the content checks (ContentError) that renderText relies on.
  const html = renderHtml(theme, content);
  return { subject: content.subject, html, text: renderText(theme, content) };
}
