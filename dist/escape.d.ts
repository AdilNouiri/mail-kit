/** Escapes text placed between tags. */
export declare function escapeHtml(text: string): string;
/** Escapes a value placed inside a quoted attribute, `href` included. */
export declare function escapeAttribute(value: string): string;
/**
 * `"http:loopback"` is not a real scheme: it allows `http:` on a loopback host only (F2.9),
 * so no value of this type opens every `http:` URL.
 */
export type UrlScheme = "https:" | "mailto:" | "http:loopback";
/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them). An `http:`
 * URL passes only with `"http:loopback"` in `schemes` and a loopback host (F2.9).
 */
export declare function isAllowedUrl(url: string, schemes: readonly UrlScheme[]): boolean;
