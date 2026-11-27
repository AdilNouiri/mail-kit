import type { Browser, Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderHtml } from "../../src/html/index.ts";
import type { MailContent, Theme } from "../../src/types.ts";
import { blockSets, themes } from "../html/fixtures.ts";
import { launch, open } from "./browser.ts";

let browser: Browser;

beforeAll(async () => {
  browser = await launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

const cases = Object.entries(themes).flatMap(([themeName, theme]) =>
  Object.entries(blockSets).map(
    ([setName, content]) =>
      [`${themeName} × ${setName}`, theme, content] as [string, Theme, MailContent],
  ),
);

function rgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}

async function styleOf(page: Page, selector: string, property: "color" | "backgroundColor") {
  return page.$eval(
    selector,
    (element, name) => getComputedStyle(element)[name as "color" | "backgroundColor"],
    property,
  );
}

function luminance(color: string): number {
  const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((part) => {
    const channel = Number(part) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** Each visible element with its own text: its colour and the first opaque background above it. */
function textPairs(page: Page) {
  return page.evaluate(() => {
    const pairs: { text: string; color: string; background: string }[] = [];
    for (const element of Array.from(document.body.querySelectorAll("*"))) {
      const ownText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim() ?? "")
        .join("")
        .replace(/ /g, "");
      if (!ownText || element.getClientRects().length === 0) continue;
      let background = "rgba(0, 0, 0, 0)";
      for (let node: Element | null = element; node; node = node.parentElement) {
        const value = getComputedStyle(node).backgroundColor;
        if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
          background = value;
          break;
        }
      }
      pairs.push({
        text: ownText.slice(0, 40),
        color: getComputedStyle(element).color,
        background,
      });
    }
    return pairs;
  });
}

describe("F4.3 dark mode in headless Chromium", () => {
  it.each(Object.entries(themes))(
    "%s: canvas, card, text, muted text and subtle fills take the dark colours",
    async (_, theme) => {
      const html = renderHtml(theme, {
        subject: "Dark",
        blocks: [
          ...blockSets.notice.blocks,
          { type: "code", code: "482913", group: 3 },
          { type: "button", label: "Open", url: "https://app.example.com/" },
        ],
      });
      const page = await open(browser, html, { colorScheme: "dark", width: 1280, height: 800 });
      try {
        const d = theme.dark;
        expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBe(
          true,
        );
        expect(await styleOf(page, "body", "backgroundColor")).toBe(rgb(d.canvas));
        expect(await styleOf(page, ".mk-outer", "backgroundColor")).toBe(rgb(d.canvas));
        expect(await styleOf(page, ".mk-card", "backgroundColor")).toBe(rgb(d.card));
        expect(await styleOf(page, ".mk-heading", "color")).toBe(rgb(d.text));
        expect(await styleOf(page, ".mk-text", "color")).toBe(rgb(d.textSoft));
        expect(await styleOf(page, ".mk-small", "color")).toBe(rgb(d.muted));
        expect(await styleOf(page, ".mk-footer", "color")).toBe(rgb(d.muted));
        expect(await styleOf(page, ".mk-small a", "color")).toBe(rgb(d.link));
        expect(await styleOf(page, ".mk-text .mk-link", "color")).toBe(rgb(d.link));
        for (const fill of [".mk-code", ".mk-note", ".mk-divider"]) {
          expect(await styleOf(page, fill, "backgroundColor"), fill).toBe(rgb(d.subtle));
        }
        expect(await styleOf(page, ".mk-banner", "backgroundColor")).toBe(rgb(theme.colors.brand));
      } finally {
        await page.context().close();
      }
    },
  );

  it.each(Object.entries(themes))("%s: light mode keeps the light colours", async (_, theme) => {
    const page = await open(browser, renderHtml(theme, blockSets.notice), {
      colorScheme: "light",
      width: 1280,
      height: 800,
    });
    try {
      expect(await styleOf(page, ".mk-card", "backgroundColor")).toBe(rgb(theme.colors.card));
      expect(await styleOf(page, ".mk-heading", "color")).toBe(rgb(theme.colors.text));
    } finally {
      await page.context().close();
    }
  });

  it.each(Object.entries(themes))(
    "%s: [data-ogsc] applies the dark text colours",
    async (_, theme) => {
      const page = await open(browser, renderHtml(theme, blockSets.notice), {
        colorScheme: "light",
        width: 1280,
        height: 800,
      });
      try {
        await page.evaluate(() => document.body.setAttribute("data-ogsc", ""));
        expect(await styleOf(page, ".mk-heading", "color")).toBe(rgb(theme.dark.text));
        expect(await styleOf(page, ".mk-text", "color")).toBe(rgb(theme.dark.textSoft));
        expect(await styleOf(page, ".mk-small", "color")).toBe(rgb(theme.dark.muted));
      } finally {
        await page.context().close();
      }
    },
  );
});

describe("F4.4 phone width in headless Chromium", () => {
  it.each(cases)(
    "%s at 390 px: no overflow, 24 px sides, square card",
    async (_, theme, content) => {
      const page = await open(browser, renderHtml(theme, content), {
        colorScheme: "light",
        width: 390,
        height: 844,
      });
      try {
        const metrics = await page.evaluate(() => {
          const card = getComputedStyle(document.querySelector(".mk-card") as Element);
          const banner = getComputedStyle(document.querySelector(".mk-banner") as Element);
          const widest = Math.max(
            ...Array.from(document.body.querySelectorAll("*")).map(
              (element) => element.getBoundingClientRect().right,
            ),
          );
          return {
            scrollWidth: document.documentElement.scrollWidth,
            widest,
            paddingLeft: card.paddingLeft,
            paddingRight: card.paddingRight,
            cardRadius: [card.borderBottomLeftRadius, card.borderBottomRightRadius],
            bannerRadius: [banner.borderTopLeftRadius, banner.borderTopRightRadius],
          };
        });
        expect(metrics.scrollWidth).toBe(390);
        expect(metrics.widest).toBeLessThanOrEqual(390);
        expect(metrics.paddingLeft).toBe("24px");
        expect(metrics.paddingRight).toBe("24px");
        expect(metrics.cardRadius).toEqual(["0px", "0px"]);
        expect(metrics.bannerRadius).toEqual(["0px", "0px"]);
      } finally {
        await page.context().close();
      }
    },
  );
});

describe("F4.6 text colour pairs meet 4.5:1 in headless Chromium", () => {
  for (const scheme of ["light", "dark"] as const) {
    it.each(cases)(`%s, ${scheme}`, async (_, theme, content) => {
      const page = await open(browser, renderHtml(theme, content), {
        colorScheme: scheme,
        width: 1280,
        height: 800,
      });
      try {
        const pairs = await textPairs(page);
        expect(pairs.length).toBeGreaterThan(5);
        for (const pair of pairs) {
          expect(
            contrast(pair.color, pair.background),
            `${pair.text}: ${pair.color} on ${pair.background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      } finally {
        await page.context().close();
      }
    });
  }
});
