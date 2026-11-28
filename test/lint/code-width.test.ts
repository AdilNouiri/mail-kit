import type { Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderCode } from "../../src/html/blocks/code.ts";
import { renderHtml } from "../../src/html/index.ts";
import { samples } from "../../src/samples.ts";
import { builtInThemes as themes } from "../../src/themes/index.ts";
import type { CodeBlock, MailContent } from "../../src/types.ts";

import { launch, open } from "./browser.ts";

const codeSample = samples.code("en");

let browser: Browser;

beforeAll(async () => {
  browser = await launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

function block(code: string, group?: number): CodeBlock {
  return group ? { type: "code", code, group } : { type: "code", code };
}

function mail(item: CodeBlock): MailContent {
  return { subject: "Code", blocks: [item] } as MailContent;
}

async function measure(item: CodeBlock, width: number, theme = themes.majordome) {
  const page = await open(browser, renderHtml(theme, mail(item)), {
    colorScheme: "light",
    width,
    height: 844,
  });
  const result = await page.evaluate(() => {
    const cell = document.querySelector(".mk-code") as HTMLElement;
    const style = getComputedStyle(cell);
    const range = document.createRange();
    range.selectNodeContents(cell);
    const text = range.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      fontSize: style.fontSize,
      letterSpacing: style.letterSpacing,
      lines: Math.round(text.height / Number.parseFloat(style.lineHeight)),
      inside: text.left >= box.left && text.right <= box.right,
    };
  });
  await page.context().close();
  return result;
}

describe("F4.7 long code fits a phone", () => {
  it("F4.7 a 12-character code with group 1 (23 characters) stays on one line at 390 px", async () => {
    const result = await measure(block("ABCDEFGHJKLM", 1), 390);
    expect(result.scrollWidth).toBe(390);
    expect(result.lines).toBe(1);
    expect(result.inside).toBe(true);
    expect(result.fontSize).toBe("16px");
    expect(result.letterSpacing).toBe("2px");
  });

  it.each(Object.entries(themes))(
    "F4.7 %s: the longest code stays on one line at 390 px",
    async (_, theme) => {
      const result = await measure(block("ABCDEFGHJKLM", 1), 390, theme);
      expect(result.scrollWidth).toBe(390);
      expect(result.lines).toBe(1);
      expect(result.inside).toBe(true);
    },
  );

  it("F4.7 the 13 to 16 character tier uses 22 px and 4 px", async () => {
    const result = await measure(block("ABCDEFGH", 1), 390);
    expect(result.fontSize).toBe("22px");
    expect(result.letterSpacing).toBe("4px");
    expect(result.scrollWidth).toBe(390);
    expect(result.lines).toBe(1);
  });

  it("F4.7 a code of at most 12 displayed characters keeps 30 px and 8 px", async () => {
    for (const item of [block("482913", 3), block("ABCDEFGHJKLM")]) {
      const result = await measure(item, 390);
      expect(result.fontSize).toBe("30px");
      expect(result.letterSpacing).toBe("8px");
    }
  });

  it("F4.7 the long code also fits the 600 px desktop card", async () => {
    const result = await measure(block("ABCDEFGHJKLM", 1), 1280);
    expect(result.lines).toBe(1);
    expect(result.inside).toBe(true);
  });

  it("F4.7 the sizes are inline, not in the style block", () => {
    const html = renderCode(themes.majordome, block("ABCDEFGHJKLM", 1));
    expect(html).toContain(
      "font-size:16px;line-height:22px;letter-spacing:2px;white-space:nowrap;",
    );
  });

  it("F4.7 the code sample's markup keeps its 30 px sizing", () => {
    const item = codeSample.blocks.find((entry) => entry.type === "code") as CodeBlock;
    const html = renderCode(themes.majordome, item);
    expect(html).toContain("font-size:30px;line-height:36px;letter-spacing:8px;font-weight:700");
    expect(html).not.toContain("white-space");
  });
});
