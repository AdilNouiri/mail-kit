import { describe, expect, it } from "vitest";
import { escapeAttribute, escapeHtml, isAllowedUrl } from "../src/escape.ts";
import { ContentError } from "../src/types.ts";

describe("ContentError", () => {
  it("has no blockIndex property when none is given", () => {
    expect("blockIndex" in new ContentError("subject", "Subject is empty.")).toBe(false);
  });

  it("keeps the block index when given", () => {
    const error = new ContentError("url", "Only https: and mailto: URLs.", 2);
    expect(error.blockIndex).toBe(2);
    expect(error.field).toBe("url");
  });
});

describe("escapeHtml", () => {
  it("F2.3 escapes markup, ampersands and double quotes in text", () => {
    expect(escapeHtml('<b>Alice & "Bob"</b>')).toBe(
      "&lt;b&gt;Alice &amp; &quot;Bob&quot;&lt;/b&gt;",
    );
  });

  it("keeps apostrophes and non-ASCII text as they are", () => {
    expect(escapeHtml("Vous n'avez rien demandé ? « Me connecter »")).toBe(
      "Vous n'avez rien demandé ? « Me connecter »",
    );
  });

  it("escapes an existing entity again, so text never turns into markup", () => {
    expect(escapeHtml("&amp; &#60;")).toBe("&amp;amp; &amp;#60;");
  });
});

describe("escapeAttribute", () => {
  it("escapes both quote kinds and markup", () => {
    expect(escapeAttribute(`a"b'c<d>&e`)).toBe("a&quot;b&#39;c&lt;d&gt;&amp;e");
  });

  it("keeps a URL with a query string usable in href", () => {
    expect(escapeAttribute("https://app.example.com/v?t=EXAMPLE-TOKEN-1234&lang=fr")).toBe(
      "https://app.example.com/v?t=EXAMPLE-TOKEN-1234&amp;lang=fr",
    );
  });
});

describe("isAllowedUrl", () => {
  const both = ["https:", "mailto:"] as const;

  it.each([
    "https://app.example.com/auth/verify?token=EXAMPLE-TOKEN-1234",
    "HTTPS://example.com",
    "mailto:alice.martin@example.com",
  ])("accepts %s", (url) => {
    expect(isAllowedUrl(url, both)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<b>x</b>",
    "http://example.com",
    "/relative/path",
    "//example.com/x",
    "https:example.com",
    "https://",
    " https://example.com",
    "https://exa mple.com",
    "https://example.com/\n",
    "java\tscript:alert(1)",
    "mailto:",
    "",
  ])("refuses %j", (url) => {
    expect(isAllowedUrl(url, both)).toBe(false);
  });

  it("refuses mailto: where only https: is allowed", () => {
    expect(isAllowedUrl("mailto:alice.martin@example.com", ["https:"])).toBe(false);
  });
});

describe("F2.9 isAllowedUrl with loopback http:", () => {
  const content = ["https:", "mailto:", "http:loopback"] as const;

  it.each([
    "http://localhost:8787/auth/verify?token=EXAMPLE-TOKEN-1234",
    "http://127.0.0.1:8787/auth/verify?token=EXAMPLE-TOKEN-1234#top",
    "http://[::1]:8787/auth/verify?token=EXAMPLE-TOKEN-1234",
    "http://localhost/",
    "http://localhost",
    "http://localhost?next=%2Fhome",
    "http://localhost#top",
    "http://localhost:8787/@me",
    "http://LOCALHOST:8787/v",
    "http://LocalHost/v",
    "HTTP://localhost:8787/v",
    "http://localhost:/",
    "http://127.0.0.1:0080/",
  ])("accepts %s", (url) => {
    expect(isAllowedUrl(url, content)).toBe(true);
  });

  it.each([
    ["lookalike", "http://localhost.example.com/"],
    ["lookalike", "http://127.0.0.1.example.com/"],
    ["lookalike", "http://localhost./"],
    ["lookalike", "http://127.0.0.1./"],
    ["lookalike", "http://mylocalhost/"],
    ["other address", "http://127.0.0.2/"],
    ["other address", "http://[::2]/"],
    ["other address", "http://0.0.0.0/"],
    ["other address", "http://example.com/"],
    ["shorthand", "http://127.1/"],
    ["shorthand", "http://0x7f.0.0.1/"],
    ["shorthand", "http://0177.0.0.1/"],
    ["shorthand", "http://2130706433/"],
    ["shorthand", "http://[0:0:0:0:0:0:0:1]/"],
    ["shorthand", "http://[::ffff:127.0.0.1]/"],
    ["shorthand", "http://[::1%25lo0]/"],
    ["percent-encoded host", "http://%6Cocalhost/"],
    ["full-width host", "http://ｌｏｃａｌｈｏｓｔ/"],
    ["userinfo", "http://localhost@evil.example/"],
    ["userinfo", "http://evil.example@localhost/"],
    ["userinfo", "http://user:pass@localhost:8787/"],
    ["userinfo", "http://@localhost/"],
    ["userinfo", "http://:@localhost/"],
    ["userinfo", "http://LOCALHOST@127.0.0.1/"],
    ["backslash", "http:\\\\localhost\\v"],
    ["backslash", "http://localhost\\@evil.example/"],
    ["missing slashes", "http:localhost/"],
    ["missing slashes", "http:/localhost/"],
    ["extra slash", "http:///localhost/"],
    ["bad port", "http://localhost:99999/"],
    ["bad port", "http://localhost:87a/"],
    ["bad port", "http://[::1]x/"],
    ["whitespace", "http://localhost:8787/ "],
    ["whitespace", "http://local\thost/"],
    ["https scheme", "https:localhost/"],
    ["no host", "http://"],
  ])("refuses %s %j", (_kind, url) => {
    expect(isAllowedUrl(url, content)).toBe(false);
  });

  it("refuses loopback http: without the loopback scheme value", () => {
    expect(isAllowedUrl("http://localhost:8787/v", ["https:", "mailto:"])).toBe(false);
    expect(isAllowedUrl("http://localhost:8787/v", ["https:"])).toBe(false);
  });

  it("leaves https: and mailto: to their own scheme values", () => {
    expect(isAllowedUrl("https://example.com/", ["http:loopback"])).toBe(false);
    expect(isAllowedUrl("mailto:alice.martin@example.com", ["http:loopback"])).toBe(false);
    expect(isAllowedUrl("https://localhost/", ["https:"])).toBe(true);
  });

  it("refuses the other schemes with loopback hosts", () => {
    for (const url of ["ftp://localhost/", "ws://localhost/", "javascript://localhost/%0a1"]) {
      expect(isAllowedUrl(url, content)).toBe(false);
    }
  });
});

describe("F2.10 misleading URLs refused for every scheme", () => {
  const all = ["https:", "mailto:", "http:loopback"] as const;
  const bidiControls = [0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069];
  const zeroWidth = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff];
  const otherBidiMarks = [0x061c, 0x200e, 0x200f];
  const misleadingCharacters = [...bidiControls, ...zeroWidth, ...otherBidiMarks].map(
    (code): [string, string] => [
      `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
      String.fromCharCode(code),
    ],
  );

  it.each([
    "https://majordomeapp.example@evil.example/",
    "https://user:secret@app.example.com/",
    "https://:secret@app.example.com/",
    "https://@app.example.com/",
    "HTTPS://app.example.com@evil.example/v",
    "https://app.example.com%40evil.example@evil.example/",
    "http://localhost@evil.example/",
    "http://evil.example@localhost/",
    "mailto://user@example.com",
  ])("refuses the userinfo of %j", (url) => {
    expect(isAllowedUrl(url, all)).toBe(false);
  });

  it.each([
    "https://a.example\\@b.example/",
    "https://app.example.com\\evil.example/",
    "https://app.example.com/path\\x",
    "mailto:alice\\@example.com",
    "http://localhost:8787\\v",
  ])("refuses the backslash of %j", (url) => {
    expect(isAllowedUrl(url, all)).toBe(false);
  });

  it.each(misleadingCharacters)("refuses %s in the host, path and mailto address", (_n, char) => {
    expect(isAllowedUrl(`https://app.example${char}.com/`, all)).toBe(false);
    expect(isAllowedUrl(`https://app.example.com/v?t=${char}1`, all)).toBe(false);
    expect(isAllowedUrl(`https://app.example.com/#${char}`, all)).toBe(false);
    expect(isAllowedUrl(`mailto:alice${char}@example.com`, all)).toBe(false);
    expect(isAllowedUrl(`http://localhost:8787/v${char}`, all)).toBe(false);
  });

  it("still accepts an @ outside the authority and a plain mailto address", () => {
    expect(isAllowedUrl("https://cdn.example.com/logo@2x.png", all)).toBe(true);
    expect(isAllowedUrl("https://app.example.com/v?to=alice@example.com#a@b", all)).toBe(true);
    expect(isAllowedUrl("mailto:alice.martin@example.com?subject=a//b@c", all)).toBe(true);
    expect(isAllowedUrl("http://localhost:8787/v?to=a@b", all)).toBe(true);
  });
});
