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
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
function hasWhitespaceOrControl(value) {
    for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        if (code <= 0x20 || code === 0x7f)
            return true;
    }
    return /\s/.test(value);
}
function asciiLowerCase(value) {
    return value.replace(/[A-Z]/g, (char) => char.toLowerCase());
}
/**
 * F2.9: the host must be `localhost`, `127.0.0.1` or `[::1]` both as written and as the
 * WHATWG parser returns it, so spellings the parser rewrites to a loopback host (`127.1`,
 * `0x7f.0.0.1`, `[0:0:0:0:0:0:0:1]`, `%6Cocalhost`, full-width letters) are refused, and
 * so is any userinfo, even an empty one.
 */
function isLoopbackHttp(url, parsed) {
    if (parsed.username !== "" || parsed.password !== "")
        return false;
    // The parser reads "\" as "/" in an http: URL; other readers may not, so none is allowed.
    if (url.includes("\\"))
        return false;
    if (asciiLowerCase(url.slice(0, 7)) !== "http://")
        return false;
    const rest = url.slice(7);
    let end = rest.length;
    for (const delimiter of ["/", "?", "#"]) {
        const at = rest.indexOf(delimiter);
        if (at !== -1 && at < end)
            end = at;
    }
    const authority = rest.slice(0, end);
    if (authority.includes("@"))
        return false;
    let host;
    let port;
    if (authority.startsWith("[")) {
        const close = authority.indexOf("]");
        if (close === -1)
            return false;
        host = authority.slice(0, close + 1);
        port = authority.slice(close + 1);
    }
    else {
        const colon = authority.indexOf(":");
        host = colon === -1 ? authority : authority.slice(0, colon);
        port = colon === -1 ? "" : authority.slice(colon);
    }
    if (port !== "" && !/^:[0-9]*$/.test(port))
        return false;
    const writtenHost = asciiLowerCase(host);
    return LOOPBACK_HOSTS.has(writtenHost) && parsed.hostname === writtenHost;
}
/**
 * True when `url` is absolute, uses one of `schemes`, has a host for `https:` and holds no
 * whitespace or control character (the URL parser would silently strip them). An `http:`
 * URL passes only with `"http:loopback"` in `schemes` and a loopback host (F2.9).
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
    if (parsed.protocol === "http:") {
        return schemes.includes("http:loopback") && isLoopbackHttp(url, parsed);
    }
    if (!schemes.includes(parsed.protocol))
        return false;
    if (parsed.protocol === "https:")
        return parsed.hostname !== "" && /^https:\/\//i.test(url);
    return parsed.pathname !== "";
}
