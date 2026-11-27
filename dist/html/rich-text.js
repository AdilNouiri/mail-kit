import { escapeAttribute, escapeHtml } from "../escape.js";
export function renderRichText(theme, content) {
    if (typeof content === "string")
        return escapeHtml(content);
    return content
        .map((inline) => {
        if (typeof inline === "string")
            return escapeHtml(inline);
        if ("bold" in inline)
            return `<strong style="font-weight:700;">${escapeHtml(inline.bold)}</strong>`;
        return `<a href="${escapeAttribute(inline.url)}" class="mk-link" style="color:${theme.colors.link};text-decoration:underline;">${escapeHtml(inline.text)}</a>`;
    })
        .join("");
}
