import { describe, expect, it } from "vitest";
import { fallbackStack } from "../../src/html/css.ts";
import { renderHtml } from "../../src/html/index.ts";
import { renderMail } from "../../src/render-mail.ts";
import { samples } from "../../src/samples.ts";
import { builtInThemes as themes } from "../../src/themes/index.ts";
import { type Block, ContentError, type MailContent, type Theme } from "../../src/types.ts";
import { notice } from "../html/fixtures.ts";

const blockSets: Record<string, (theme: Theme) => MailContent> = {
  ...Object.fromEntries(
    Object.entries(samples).map(([name, sample]) => [name, (theme: Theme) => sample(theme.lang)]),
  ),
  "notice fixture (link block, inline link)": () => notice,
};

const cases = Object.entries(themes).flatMap(([themeName, theme]) =>
  Object.entries(blockSets).map(
    ([setName, build]) =>
      [`${themeName} × ${setName}`, theme, build(theme)] as [string, Theme, MailContent],
  ),
);

describe("F4.1 forbidden constructs absent", () => {
  it.each(cases)("%s", (_, theme, content) => {
    const html = renderHtml(theme, content);
    for (const forbidden of [
      /<script/i,
      /<link/i,
      /<svg/i,
      /<img[^>]*src="[^"]*\.svg/i,
      /<form/i,
    ]) {
      expect(html).not.toMatch(forbidden);
    }
    for (const forbidden of [/display:\s*flex/i, /display:\s*grid/i, /position:/i, /var\(/i]) {
      expect(html).not.toMatch(forbidden);
    }
    const fontUrls = new Set(theme.webFonts.map((font) => font.url));
    for (const match of html.matchAll(/url\(\s*['"]?([^'")]*)['"]?\s*\)/gi)) {
      expect(fontUrls.has(match[1] ?? ""), `url(${match[1]})`).toBe(true);
    }
    for (const tag of html.matchAll(/<[a-z][^>]*\sclass="[^"]*"[^>]*>/gi)) {
      expect(tag[0], "a class needs an inline style for the light look").toMatch(/\sstyle="[^"]+"/);
    }
  });
});

describe("F4.2 Outlook frame", () => {
  it.each(cases)("%s", (_, theme, content) => {
    const html = renderHtml(theme, content);
    expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
    expect(html).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
    expect(html).toContain(
      "<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->",
    );
    expect(html).toContain(
      '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
    );
    const mso = /<!--\[if mso\]><style>([\s\S]*?)<\/style><!\[endif\]-->/.exec(html)?.[1];
    expect(mso).toBeDefined();
    for (const font of theme.webFonts) expect(mso).not.toContain(font.family);
  });

  it("replaces Majordome-like web fonts with the fallback stacks", () => {
    const html = renderHtml(themes.majordome, samples["magic-link"]("fr"));
    expect(html).toContain(
      ".mk-heading, .mk-wordmark { font-family:Georgia, 'Times New Roman', serif !important; }",
    );
    expect(html).toContain(
      "font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;",
    );
    expect(html).toContain(
      "@font-face{font-family:'Gloock';src:url('https://majordomeapp.fr/fonts/Gloock-Regular.woff2') format('woff2');font-weight:400}",
    );
  });
});

describe("F4.2 fallback stack never empty", () => {
  it("keeps the generic family when the stack holds web fonts only", () => {
    expect(fallbackStack(themes.majordome, "'Gloock'")).toBe("'Gloock'");
    expect(fallbackStack(themes.majordome, "'Figtree', sans-serif")).toBe("sans-serif");
    expect(fallbackStack(themes.majordome, "")).toBe("sans-serif");
  });
});

describe("F4.3 dark mode (static part)", () => {
  it.each(cases)("%s: metas and Outlook.com [data-ogsc] text colours", (_, theme, content) => {
    const html = renderHtml(theme, content);
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    const d = theme.dark;
    expect(html).toContain(`[data-ogsc] .mk-heading { color:${d.text} !important; }`);
    expect(html).toContain(`[data-ogsc] .mk-text { color:${d.textSoft} !important; }`);
    expect(html).toContain(
      `[data-ogsc] .mk-code, [data-ogsc] .mk-note { color:${d.text} !important; }`,
    );
    expect(html).toContain(
      `[data-ogsc] .mk-small, [data-ogsc] .mk-footer { color:${d.muted} !important; }`,
    );
    expect(html).toContain(
      `[data-ogsc] .mk-small a, [data-ogsc] .mk-link { color:${d.link} !important; }`,
    );
  });
});

describe("F4.5 size under Gmail's clip", () => {
  it.each(cases)("%s is under 60 KB", (_, theme, content) => {
    expect(new TextEncoder().encode(renderHtml(theme, content)).length).toBeLessThan(60 * 1024);
  });

  it("a 30-block mail with long texts stays under 60 KB", () => {
    const long = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(5);
    const kinds: Block[] = [
      { type: "paragraph", content: long },
      {
        type: "button",
        label: "Open the page",
        url: "https://app.example.com/a?token=EXAMPLE-TOKEN-1234",
      },
      { type: "note", content: long },
    ];
    const blocks = Array.from({ length: 30 }, (_, index) => kinds[index % kinds.length] as Block);
    const html = renderHtml(themes.majordome, { subject: "Big", preheader: "p", blocks });
    expect(new TextEncoder().encode(html).length).toBeLessThan(60 * 1024);
  });
});

describe("F4.8 oversized mail refused", () => {
  it("F4.8 refuses 30 buttons with 2,000-character URLs", () => {
    const blocks: Block[] = Array.from({ length: 30 }, () => ({
      type: "button",
      label: "Open",
      url: `https://app.example.com/${"a".repeat(2000)}`,
    }));
    for (const theme of Object.values(themes)) {
      try {
        renderMail(theme, { subject: "Big", blocks });
        expect.unreachable("renderMail should refuse an oversized mail");
      } catch (error) {
        expect(error).toBeInstanceOf(ContentError);
        expect((error as ContentError).field).toBe("html");
        expect((error as ContentError).message).toMatch(/\d{6} bytes/);
      }
    }
  });

  it.each(cases)("F4.8 accepts %s, under 60 KB", (_, theme, content) => {
    const { html } = renderMail(theme, content);
    expect(new TextEncoder().encode(html).length).toBeLessThan(60 * 1024);
  });
});

describe("F4.6 accessible (markup)", () => {
  it.each(cases)("%s", (_, theme, content) => {
    const html = renderHtml(theme, content);
    expect(html).toContain(`<html lang="${theme.lang}" `);
    for (const table of html.matchAll(/<table\b[^>]*>/g)) {
      expect(table[0]).toContain('role="presentation"');
    }
    for (const img of html.matchAll(/<img\b[^>]*>/g)) expect(img[0]).toContain('alt=""');
    expect(html).toMatch(/<h1 class="mk-heading"/);
    expect(html).not.toMatch(/<h[2-6]\b/);
  });
});
