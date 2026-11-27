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
