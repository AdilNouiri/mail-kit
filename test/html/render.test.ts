import { describe, expect, it } from "vitest";
import { renderHtml } from "../../src/html/index.ts";
import { renderMail } from "../../src/render-mail.ts";
import { type Block, ContentError, type MailContent, VERSION } from "../../src/types.ts";
import {
  code,
  dreamStudioLike,
  everyBlock,
  magicLink,
  majordomeLike,
  TOKEN_URL,
  themes,
} from "./fixtures.ts";

function mail(blocks: readonly Block[], extra: Partial<MailContent> = {}): MailContent {
  return { subject: "Subject", blocks, ...extra };
}

function thrown(run: () => unknown): ContentError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(ContentError);
    return error as ContentError;
  }
  throw new Error("expected a ContentError");
}

function inOrder(html: string, markers: readonly string[]): void {
  let from = -1;
  for (const marker of markers) {
    const at = html.indexOf(marker, from + 1);
    expect(at, `${marker} after position ${from}`).toBeGreaterThan(from);
    from = at;
  }
}

describe("F2.1 layout in order", () => {
  it.each(Object.entries(themes))(
    "%s: preheader, banner, accent rule, card, footer",
    (_, theme) => {
      const html = renderHtml(theme, magicLink);
      const markers = [
        '<div style="display:none;',
        'class="mk-banner"',
        ...(theme.logo ? [`<img src="${theme.logo.url}"`] : []),
        'class="mk-wordmark"',
        `<tr><td bgcolor="${theme.colors.accent}" style="background:${theme.colors.accent};height:4px;`,
        'class="mk-card mk-pad"',
        'class="mk-heading"',
        'class="mk-footer"',
      ];
      inOrder(html, markers);
    },
  );

  it("starts with the doctype and carries the version stamp once (F6.5)", () => {
    const html = renderHtml(majordomeLike, magicLink);
    expect(html.startsWith("<!doctype html>\n")).toBe(true);
    expect(html.split(`<!-- mail-kit ${VERSION} -->`)).toHaveLength(2);
  });

  it("shows the wordmark alone when the theme has no logo", () => {
    const html = renderHtml(dreamStudioLike, code);
    expect(html).not.toContain("<img");
    expect(html).toContain('letter-spacing:3px;">DREAM STUDIO</td>');
  });

  it("uses footerReason over the theme's reason", () => {
    const html = renderHtml(dreamStudioLike, { ...code, footerReason: "A custom reason." });
    expect(html).toContain("A custom reason.<br>");
    expect(html).not.toContain(dreamStudioLike.footer.reason);
  });
});

describe("F2.2 each block renders", () => {
  const t = dreamStudioLike;
  const c = t.colors;
  const html = renderHtml(t, mail(everyBlock));
  const font = t.fonts.text;

  it("renders each block once, in content order", () => {
    for (const marker of [
      "mk-heading",
      "mk-text",
      "mk-button",
      "mk-small",
      "mk-code",
      "mk-note",
      "mk-divider",
    ]) {
      expect(html.split(`class="${marker}"`), marker).toHaveLength(2);
    }
    inOrder(html, [
      'class="mk-heading"',
      'class="mk-text"',
      'class="mk-button"',
      'class="mk-small"',
      'class="mk-code"',
      'class="mk-note"',
      'class="mk-divider"',
    ]);
  });

  it("uses the mockups' markup and inline styles", () => {
    expect(html).toContain(
      `<h1 class="mk-heading" style="margin:0 0 16px;font-family:${font};font-weight:700;font-size:28px;line-height:34px;color:${c.text};">Every block</h1>`,
    );
    expect(html).toContain(
      `<p class="mk-text" style="margin:0 0 16px;font-family:${font};font-size:16px;line-height:24px;color:${c.textSoft};">A paragraph.</p>`,
    );
    expect(html).toContain(
      `<td bgcolor="${c.accent}" style="background:${c.accent};border-radius:10px;">\n    <a href="https://app.example.com/open" class="mk-button" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:16px;line-height:20px;font-weight:600;color:${c.onAccent};text-decoration:none;border-radius:10px;">Open</a>`,
    );
    expect(html).toContain(
      `<p class="mk-small" style="margin:0 0 24px;font-family:${font};font-size:13px;line-height:20px;color:${c.muted};">The address:<br><a href="https://app.example.com/link" class="mk-link" style="color:${c.link};word-break:break-all;">https://app.example.com/link</a></p>`,
    );
    expect(html).toContain(
      `style="background:${c.subtle};border-radius:12px;padding:18px 12px;font-family:'SFMono-Regular',Menlo,Consolas,'Courier New',monospace;font-size:30px;line-height:36px;letter-spacing:8px;font-weight:700;color:${c.text};">ABC123</td>`,
    );
    expect(html).toContain(
      `<td class="mk-note" bgcolor="${c.subtle}" style="background:${c.subtle};border-left:3px solid ${c.accent};border-radius:0 8px 8px 0;padding:12px 16px;font-family:${font};font-size:14px;line-height:21px;color:${c.textSoft};">A note.</td>`,
    );
    expect(html).toContain(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>\n  <td class="mk-divider" bgcolor="${c.subtle}" style="background:${c.subtle};height:1px;line-height:1px;font-size:0;">&nbsp;</td>`,
    );
  });

  it("renders a paragraph Inline link in colors.link, underlined, and bold text", () => {
    const out = renderHtml(
      t,
      mail([
        {
          type: "paragraph",
          content: [
            "See ",
            { bold: "this" },
            " and ",
            { text: "that", url: "https://example.com/a?b=1&c=2" },
          ],
        },
      ]),
    );
    expect(out).toContain(
      `See <strong style="font-weight:700;">this</strong> and <a href="https://example.com/a?b=1&amp;c=2" class="mk-link" style="color:${c.link};text-decoration:underline;">that</a>`,
    );
  });
});

describe("F2.3 text escaped", () => {
  it("escapes quotes in a URL in the button href, the VML href and the fallback link", () => {
    const url = `https://example.com/a?q="x"&b='y'`;
    const escaped = "https://example.com/a?q=&quot;x&quot;&amp;b=&#39;y&#39;";
    const html = renderHtml(majordomeLike, mail([{ type: "button", label: "Go", url }]));
    expect(html).toContain(
      `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escaped}"`,
    );
    expect(html).toContain(`<a href="${escaped}" class="mk-button"`);
    expect(html).toContain(`<a href="${escaped}" class="mk-link"`);
    expect(html).not.toContain(`"x"`);
    expect(html).not.toMatch(/href="[^"]*'/);
  });

  it("escapes a paragraph and lets no tag through", () => {
    const html = renderHtml(
      majordomeLike,
      mail([{ type: "paragraph", content: '<b>Alice & "Bob"</b>' }]),
    );
    expect(html).toContain("&lt;b&gt;Alice &amp; &quot;Bob&quot;&lt;/b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("escapes every other text: subject, preheader, heading, inline parts, labels, footer", () => {
    const evil = "<i>x</i>";
    const html = renderHtml(
      majordomeLike,
      mail(
        [
          { type: "heading", text: evil },
          {
            type: "paragraph",
            content: [evil, { bold: evil }, { text: evil, url: "https://example.com/" }],
          },
          { type: "button", label: evil, url: "https://example.com/" },
          { type: "link", lead: evil, url: "https://example.com/" },
          { type: "note", content: evil },
        ],
        { subject: evil, preheader: evil, footerReason: evil },
      ),
    );
    expect(html).not.toContain("<i>");
  });
});

describe("F2.4 URLs checked", () => {
  const bad = [
    "javascript:alert(1)",
    "data:text/html,<b>x</b>",
    "http://example.com/",
    "/relative",
    "https://exa mple.com/",
  ];

  it.each(bad)("button url %s throws a ContentError with the block index", (url) => {
    const error = thrown(() =>
      renderMail(
        majordomeLike,
        mail([
          { type: "heading", text: "H" },
          { type: "button", label: "Go", url },
        ]),
      ),
    );
    expect(error.blockIndex).toBe(1);
    expect(error.field).toBe("url");
  });

  it.each(bad)("link url %s throws a ContentError with the block index", (url) => {
    const error = thrown(() => renderMail(majordomeLike, mail([{ type: "link", lead: "L", url }])));
    expect(error.blockIndex).toBe(0);
    expect(error.field).toBe("url");
  });

  it("checks Inline link URLs too", () => {
    const error = thrown(() =>
      renderHtml(
        majordomeLike,
        mail([
          { type: "note", content: [{ text: "x", url: "javascript:alert(1)" }] },
          { type: "divider" },
        ]),
      ),
    );
    expect(error.blockIndex).toBe(0);
    expect(error.field).toBe("content");
  });

  it("accepts mailto: and https:", () => {
    expect(() =>
      renderHtml(
        majordomeLike,
        mail([
          { type: "button", label: "Mail", url: "mailto:support@example.com" },
          { type: "link", lead: "L", url: "https://example.com/" },
        ]),
      ),
    ).not.toThrow();
  });
});

describe("F2.5 button with fallback link", () => {
  it("outputs a bulletproof button and a VML roundrect for Outlook", () => {
    const html = renderHtml(majordomeLike, magicLink);
    expect(html).toMatch(
      /<!--\[if mso\]>\s*<div[^>]*><v:roundrect [^>]*href="https:\/\/app\.example\.com\/auth\/verify\?token=EXAMPLE-TOKEN-1234"[^>]*fillcolor="#c8372d"[^>]*>[\s\S]*?Me connecter[\s\S]*?<\/v:roundrect><\/div>\s*<!\[endif\]-->/,
    );
    expect(html).toMatch(
      /<td bgcolor="#c8372d" style="background:#c8372d;border-radius:999px;">\s*<a href="[^"]+" class="mk-button" style="display:inline-block;padding:14px 28px;/,
    );
    expect(html).toContain('arcsize="100%"');
  });

  it("follows with the French lead and the address for a fr theme", () => {
    const html = renderHtml(majordomeLike, magicLink);
    inOrder(html, [
      'class="mk-button"',
      "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :<br>",
      `>${TOKEN_URL}</a>`,
    ]);
  });

  it("uses the English lead for an en theme", () => {
    const html = renderHtml(
      dreamStudioLike,
      mail([{ type: "button", label: "Go", url: TOKEN_URL }]),
    );
    expect(html).toContain("Button not working? Paste this address into your browser:<br>");
  });

  it("drops the fallback link with fallback: false", () => {
    const html = renderHtml(
      dreamStudioLike,
      mail([{ type: "button", label: "Go", url: TOKEN_URL, fallback: false }]),
    );
    expect(html).not.toContain("Button not working?");
    expect(html).not.toContain('class="mk-small"');
  });
});

describe("F2.6 code block readable", () => {
  it("shows 482 913 in a monospace stack with aria-label 482913", () => {
    const html = renderHtml(dreamStudioLike, code);
    expect(html).toMatch(
      /<td class="mk-code" align="center" aria-label="482913" [^>]*monospace;[^>]*>482 913<\/td>/,
    );
  });

  it("leaves the code whole with group 0 and groups the last part short", () => {
    expect(renderHtml(dreamStudioLike, mail([{ type: "code", code: "ABCDE" }]))).toContain(
      ">ABCDE</td>",
    );
    expect(
      renderHtml(dreamStudioLike, mail([{ type: "code", code: "ABCDE", group: 2 }])),
    ).toContain(">AB CD E</td>");
  });

  it.each([
    [{ type: "code", code: "abc" }, "code"],
    [{ type: "code", code: "" }, "code"],
    [{ type: "code", code: "ABCDEFGHIJKLM" }, "code"],
    [{ type: "code", code: "ABC", group: 7 }, "group"],
    [{ type: "code", code: "ABC", group: 1.5 }, "group"],
  ] as [Block, string][])("refuses %o", (block, field) => {
    const error = thrown(() => renderHtml(dreamStudioLike, mail([block])));
    expect(error.field).toBe(field);
    expect(error.blockIndex).toBe(0);
  });
});

describe("F2.8 same input, same bytes", () => {
  it.each(Object.entries(themes))("%s renders identical html twice", (_, theme) => {
    expect(renderHtml(theme, magicLink)).toBe(renderHtml(theme, magicLink));
    expect(renderHtml(theme, code)).toBe(renderHtml(theme, code));
  });
});

describe("F2 edge cases and content checks", () => {
  it("refuses empty blocks", () => {
    const error = thrown(() => renderMail(majordomeLike, mail([])));
    expect(error.field).toBe("blocks");
    expect(error.blockIndex).toBeUndefined();
  });

  it("refuses more than 30 blocks", () => {
    const blocks = Array.from({ length: 31 }, (): Block => ({ type: "divider" }));
    expect(thrown(() => renderHtml(majordomeLike, mail(blocks))).field).toBe("blocks");
  });

  it.each(["", "x".repeat(201), "Hello\r\nBcc: a@example.com", "Line\nbreak"])(
    "refuses the subject %j",
    (subject) => {
      expect(
        thrown(() => renderMail(majordomeLike, mail([{ type: "divider" }], { subject }))).field,
      ).toBe("subject");
    },
  );

  it("accepts a 200-character subject", () => {
    expect(() =>
      renderHtml(majordomeLike, mail([{ type: "divider" }], { subject: "x".repeat(200) })),
    ).not.toThrow();
  });

  it("has no hidden preheader div when preheader is absent", () => {
    const html = renderHtml(majordomeLike, mail([{ type: "divider" }]));
    expect(html).not.toContain("display:none");
  });

  it("refuses a preheader over 140 characters", () => {
    const error = thrown(() =>
      renderHtml(majordomeLike, mail([{ type: "divider" }], { preheader: "x".repeat(141) })),
    );
    expect(error.field).toBe("preheader");
  });

  it.each([
    [{ type: "heading", text: "" }, "text"],
    [{ type: "heading", text: "x".repeat(121) }, "text"],
    [{ type: "button", label: "", url: TOKEN_URL }, "label"],
    [{ type: "button", label: "x".repeat(41), url: TOKEN_URL }, "label"],
    [{ type: "image", url: TOKEN_URL }, "type"],
  ] as unknown as [Block, string][])("refuses %o with its field and index", (block, field) => {
    const error = thrown(() => renderHtml(majordomeLike, mail([{ type: "divider" }, block])));
    expect(error.field).toBe(field);
    expect(error.blockIndex).toBe(1);
  });
});
