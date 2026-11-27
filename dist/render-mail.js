import { renderHtml } from "./html/index.js";
import { renderText } from "./text.js";
export function renderMail(theme, content) {
    // renderHtml runs first: it holds the content checks (ContentError) that renderText relies on.
    const html = renderHtml(theme, content);
    return { subject: content.subject, html, text: renderText(theme, content) };
}
