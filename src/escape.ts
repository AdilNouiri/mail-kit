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

/**
 * `"http:loopback"` is not a real scheme: it allows `http:` on a loopback host only (F2.9),
 * so no value of this type opens every `http:` URL.
 */
export type UrlScheme = "https:" | "mailto:" | "http:loopback";

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hasWhitespaceOrControl(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return /\s/.test(value);
}

/**
 * F2.10: code point ranges that make the address a reader sees differ from the one the
 * parser opens. The parser reads `\` (U+005C) as `/` in `http:` and `https:` URLs, other
 * readers may not; the Unicode Bidi_Control characters (U+061C, U+200E, U+200F, U+202A to
 * U+202E, U+2066 to U+2069) reorder the printed text; zero-width characters (U+200B to
 * U+200D, U+2060, U+FEFF) hide.
 */
const MISLEADING: readonly (readonly [number, number])[] = [
  [0x5c, 0x5c],
  [0x061c, 0x061c],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2060],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
];

function hasMisleading(url: string): boolean {
  for (let index = 0; index < url.length; index++) {
    const code = url.charCodeAt(index);
    if (MISLEADING.some(([from, to]) => code >= from && code <= to)) return true;
  }
  return false;
}

function asciiLowerCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => char.toLowerCase());
}

/** The text between `//` and the first `/`, `?` or `#`, as written. */
function writtenAuthority(url: string): string {
  const rest = url.slice(url.indexOf("//") + 2);
  let end = rest.length;
  for (const delimiter of ["/", "?", "#"]) {
    const at = rest.indexOf(delimiter);
    if (at !== -1 && at < end) end = at;
  }
  return rest.slice(0, end);
}

/** Any userinfo, even an empty one (`https://@host/`): the text before `@` misleads a reader. */
function hasUserinfo(url: string, parsed: URL): boolean {
  if (parsed.username !== "" || parsed.password !== "") return true;
  return parsed.host !== "" && url.includes("//") && writtenAuthority(url).includes("@");
}

/**
 * F2.9: the host must be `localhost`, `127.0.0.1` or `[::1]` both as written and as the
 * WHATWG parser returns it, so spellings the parser rewrites to a loopback host (`127.1`,
 * `0x7f.0.0.1`, `[0:0:0:0:0:0:0:1]`, `%6Cocalhost`, full-width letters) are refused.
 */
function isLoopbackHttp(url: string, parsed: URL): boolean {
  if (asciiLowerCase(url.slice(0, 7)) !== "http://") return false;
  const authority = writtenAuthority(url);
  let host: string;
  let port: string;
  if (authority.startsWith("[")) {
    const close = authority.indexOf("]");
    if (close === -1) return false;
    host = authority.slice(0, close + 1);
    port = authority.slice(close + 1);
  } else {
    const colon = authority.indexOf(":");
    host = colon === -1 ? authority : authority.slice(0, colon);
    port = colon === -1 ? "" : authority.slice(colon);
  }
  if (port !== "" && !/^:[0-9]*$/.test(port)) return false;
  const writtenHost = asciiLowerCase(host);
  return LOOPBACK_HOSTS.has(writtenHost) && parsed.hostname === writtenHost;
}

/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them). An `http:`
 * URL passes only with `"http:loopback"` in `schemes` and a loopback host (F2.9). For every
 * scheme, a userinfo, a backslash, a bidi control or a zero-width character is refused
 * (F2.10): the visible fallback link would print a misleading address.
 */
export function isAllowedUrl(url: string, schemes: readonly UrlScheme[]): boolean {
  if (hasWhitespaceOrControl(url) || hasMisleading(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (hasUserinfo(url, parsed)) return false;
  if (parsed.protocol === "http:") {
    return schemes.includes("http:loopback") && isLoopbackHttp(url, parsed);
  }
  if (!(schemes as readonly string[]).includes(parsed.protocol)) return false;
  if (parsed.protocol === "https:") return parsed.hostname !== "" && /^https:\/\//i.test(url);
  return parsed.pathname !== "";
}
