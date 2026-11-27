const TEXT_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

const ATTRIBUTE_ESCAPES: Readonly<Record<string, string>> = { ...TEXT_ESCAPES, "'": "&#39;" };

/** Escapes text placed between tags. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => TEXT_ESCAPES[char] ?? char);
}

/** Escapes a value placed inside a quoted attribute, `href` included. */
export function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ATTRIBUTE_ESCAPES[char] ?? char);
}

export type UrlScheme = "https:" | "mailto:";

function hasWhitespaceOrControl(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return /\s/.test(value);
}

/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them).
 */
export function isAllowedUrl(url: string, schemes: readonly UrlScheme[]): boolean {
  if (hasWhitespaceOrControl(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!(schemes as readonly string[]).includes(parsed.protocol)) return false;
  if (parsed.protocol === "https:") return parsed.hostname !== "" && /^https:\/\//i.test(url);
  return parsed.pathname !== "";
}
