import { describe, expect, it } from "vitest";
import { renderMail } from "../src/render-mail.ts";
import { renderText } from "../src/text.ts";
import { defineTheme } from "../src/theme.ts";
import { majordome, majordomeInput } from "../src/themes/majordome.ts";
import { ContentError, type Lang, type MailContent, type Theme } from "../src/types.ts";

function theme(lang: Lang): Theme {
  return defineTheme({
    ...majordomeInput,
    id: "test",
    wordmark: "Test",
    lang,
    fonts: { display: "serif", text: "sans-serif" },
    webFonts: [],
    footer: {
      reason: "You received this mail because you asked to sign in.",
      legal: "Example Co, 1 Example Street.",
      link: { label: "Help", url: "https://example.com/help" },
    },
  });
}

const sample: MailContent = {
  subject: "Hello",
  blocks: [
    { type: "heading", text: "Welcome back" },
    {
      type: "paragraph",
      content: [
        "Click ",
        { bold: "now" },
        " or see ",
        { text: "docs", url: "https://example.com/d" },
      ],
    },
    { type: "button", label: "Me connecter", url: "https://app.example.com/v?t=1" },
    { type: "code", code: "482913", group: 3 },
    { type: "divider" },
    { type: "note", content: "A note." },
  ],
};

describe("renderText", () => {
  it("F3.1 keeps every word in order, footer last", () => {
    const text = renderText(theme("en"), sample);
    const words = [
      "Welcome",
      "back",
      "Click",
      "now",
      "docs",
      "Me",
      "connecter",
      "482",
      "913",
      "note.",
      "--",
      "received",
      "Example",
      "Help",
    ];
    let at = -1;
    for (const word of words) {
      const next = text.indexOf(word, at + 1);
      expect(next, word).toBeGreaterThan(at);
      at = next;
    }
    expect(text.endsWith("\n")).toBe(true);
  });

  it("F3.2 button is label and address, once", () => {
    const url = "https://app.example.com/v?t=1";
    const fr = renderText(theme("fr"), {
      subject: "s",
      blocks: [{ type: "button", label: "Me connecter", url }],
    });
    expect(fr.split("\n")).toContain(`Me connecter : ${url}`);
    expect(fr.split(url)).toHaveLength(2);
    const en = renderText(theme("en"), {
      subject: "s",
      blocks: [{ type: "button", label: "Sign in", url }],
    });
    expect(en.split("\n")).toContain(`Sign in: ${url}`);
  });

  it("F3.3 never breaks a URL, wraps other lines at 76", () => {
    const url = `https://example.com/${"a".repeat(280)}`;
    const long = Array.from({ length: 60 }, () => "word").join(" ");
    const text = renderText(theme("en"), {
      subject: "s",
      blocks: [
        { type: "link", lead: "Open", url },
        { type: "paragraph", content: long },
      ],
    });
    const lines = text.split("\n");
    expect(lines).toContain(url);
    for (const line of lines) if (line !== url) expect(line.length).toBeLessThanOrEqual(76);
    expect(lines.filter((l) => l.startsWith("word")).length).toBeGreaterThan(1);
  });

  it("F3.4 has no tag or entity", () => {
    const text = renderText(theme("fr"), sample);
    expect(text).not.toMatch(/<[a-z/][^>]*>/i);
    expect(text).not.toMatch(/&(#\d+|#x[0-9a-f]+|[a-z]+);/i);
  });

  it("F3.5 underlines headings and separates blocks by one empty line", () => {
    const text = renderText(theme("en"), {
      subject: "s",
      blocks: [
        { type: "heading", text: "Title" },
        { type: "paragraph", content: "Body" },
      ],
    });
    expect(text.startsWith("Title\n=====\n\nBody\n\n--\n")).toBe(true);
  });

  it("F3.3 and F3.5 wrap a long heading at 76 and underline its longest line", () => {
    const title = Array.from({ length: 14 }, () => "heading").join(" ");
    const lines = renderText(theme("en"), {
      subject: "s",
      blocks: [{ type: "heading", text: title }],
    }).split("\n");
    const first = lines.findIndex((line) => /^=+$/.test(line));
    const heading = lines.slice(0, first);
    expect(heading.length).toBeGreaterThan(1);
    for (const line of heading) expect(line.length).toBeLessThanOrEqual(76);
    expect(lines[first]).toBe("=".repeat(Math.max(...heading.map((line) => line.length))));
  });

  it("F3.5 counts grapheme clusters, an emoji with a skin tone is one", () => {
    const text = renderText(theme("en"), {
      subject: "s",
      blocks: [{ type: "heading", text: "Hi 👍🏽 👨‍👩‍👧" }],
    });
    expect(text.startsWith("Hi 👍🏽 👨‍👩‍👧\n======\n")).toBe(true);
  });

  it("F3.3 keeps U+00A0 and U+202F inside a word", () => {
    const text = renderText(theme("fr"), {
      subject: "s",
      blocks: [
        { type: "heading", text: "Prix : 5 €" },
        { type: "paragraph", content: "Vraiment ? Oui !" },
      ],
    });
    expect(text.startsWith("Prix : 5 €\n")).toBe(true);
    expect(text).toContain("Vraiment ? Oui !\n");
  });

  it("renders code, divider and footer edge cases", () => {
    const c: MailContent = {
      subject: "s",
      blocks: [{ type: "code", code: "482913", group: 3 }, { type: "divider" }],
      footerReason: "Custom reason.",
    };
    const fr = renderText(theme("fr"), c);
    expect(fr).toContain("Code : 482 913\n");
    expect(renderText(theme("en"), c)).toContain("Code: 482 913\n");
    expect(fr).toContain("\n---\n");
    expect(fr).toContain("\n--\nCustom reason.\n");
  });
});

describe("F2.9 loopback http: in the text part", () => {
  // Short addresses: the lines then fit in 76 columns, so wrapping does not differ.
  const https = "https://app.example.com/v?t=EXAMPLE-TOKEN-1234";

  function withUrl(url: string): MailContent {
    return {
      subject: "s",
      blocks: [
        { type: "button", label: "Me connecter", url },
        { type: "link", lead: "Or open", url },
        { type: "paragraph", content: ["See ", { text: "the page", url }, "."] },
      ],
    };
  }

  it.each([
    "http://localhost:8787/v?t=EXAMPLE-TOKEN-1234",
    "http://127.0.0.1:8787/v?t=EXAMPLE-TOKEN-1234#top",
    "http://[::1]:8787/v?t=EXAMPLE-TOKEN-1234",
    "http://LOCALHOST:8787/v",
  ])("%s renders like an https: URL through renderMail", (url) => {
    const { text } = renderMail(majordome, withUrl(url));
    expect(text).toBe(renderMail(majordome, withUrl(https)).text.split(https).join(url));
    const lines = text.split("\n");
    expect(lines).toContain(`Me connecter : ${url}`);
    expect(lines).toContain(`Or open ${url}`);
    expect(text).toContain(`the page (${url})`);
  });

  it.each([
    "http://localhost.example.com/",
    "http://localhost./",
    "http://127.1/",
    "http://localhost@evil.example/",
    "http://evil.example@localhost/",
  ])("%s throws a ContentError before any text part", (url) => {
    expect(() => renderMail(majordome, withUrl(url))).toThrow(ContentError);
  });
});
