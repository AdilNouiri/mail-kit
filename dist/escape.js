const TEXT_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
};
const ATTRIBUTE_ESCAPES = { ...TEXT_ESCAPES, "'": "&#39;" };
/** Escapes text placed between tags. */
export function escapeHtml(text) {
    return text.replace(/[&<>"]/g, (char) => TEXT_ESCAPES[char] ?? char);
}
/** Escapes a value placed inside a quoted attribute, `href` included. */
export function escapeAttribute(value) {
    return value.replace(/[&<>"']/g, (char) => ATTRIBUTE_ESCAPES[char] ?? char);
}
function hasWhitespaceOrControl(value) {
    for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        if (code <= 0x20 || code === 0x7f)
            return true;
    }
    return /\s/.test(value);
}
/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them).
 */
export function isAllowedUrl(url, schemes) {
    if (hasWhitespaceOrControl(url))
        return false;
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        return false;
    }
    if (!schemes.includes(parsed.protocol))
        return false;
    if (parsed.protocol === "https:")
        return parsed.hostname !== "" && /^https:\/\//i.test(url);
    return parsed.pathname !== "";
}
