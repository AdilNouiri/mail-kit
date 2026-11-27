/** Escapes text placed between tags. */
export declare function escapeHtml(text: string): string;
/** Escapes a value placed inside a quoted attribute, `href` included. */
export declare function escapeAttribute(value: string): string;
export type UrlScheme = "https:" | "mailto:";
/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them).
 */
export declare function isAllowedUrl(url: string, schemes: readonly UrlScheme[]): boolean;
