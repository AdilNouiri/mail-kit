import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import {
  allPairs,
  findBrowser,
  mapAssetUrls,
  missingBrowserMessage,
} from "../../scripts/preview.ts";
import { renderMail } from "../../src/render-mail.ts";
import { samples } from "../../src/samples.ts";
import { buildEml } from "./eml.ts";
import { emulateGmailWebA, emulateGmailWebB, emulateOutlookCom } from "./emulate.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "..", "..");

export type Client = "gmail-a" | "gmail-b" | "outlook";

interface Variant {
  readonly client: Client;
  readonly widths: readonly number[];
  readonly emulate: (html: string) => string;
}

const VARIANTS: readonly Variant[] = [
  { client: "gmail-a", widths: [1280, 390], emulate: emulateGmailWebA },
  { client: "gmail-b", widths: [1280], emulate: emulateGmailWebB },
  { client: "outlook", widths: [1280], emulate: emulateOutlookCom },
];

export interface ShotCheck {
  readonly name: string;
  readonly client: Client;
  readonly width: number;
  readonly png: string;
  readonly bannerVisible: boolean;
  readonly footerVisible: boolean;
  readonly buttonVisible: boolean | null;
  readonly buttonBackground: string | null;
  readonly widestInnerElement: number;
  readonly pageOverflow: boolean;
}

async function measure(page: import("playwright-core").Page): Promise<{
  bannerVisible: boolean;
  footerVisible: boolean;
  buttonVisible: boolean | null;
  buttonBackground: string | null;
  widestInnerElement: number;
  pageOverflow: boolean;
}> {
  return page.evaluate(() => {
    const visible = (selector: string): boolean | null => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };
    const button = document.querySelector('a[class*="mk-button"]');
    const viewport = document.documentElement.clientWidth;
    const card = document.querySelector('[class*="mk-card"]');
    let widest = 0;
    if (card) {
      for (const el of [card, ...card.querySelectorAll("*")]) {
        widest = Math.max(widest, el.getBoundingClientRect().width);
      }
    }
    return {
      bannerVisible: visible('[class*="mk-banner"]') === true,
      footerVisible: visible('[class*="mk-footer"]') === true,
      buttonVisible: button ? visible('a[class*="mk-button"]') : null,
      buttonBackground: button?.parentElement
        ? getComputedStyle(button.parentElement).backgroundColor
        : null,
      widestInnerElement: Math.round(widest),
      pageOverflow: document.documentElement.scrollWidth > viewport,
    };
  });
}

export interface ClientRunResult {
  readonly outDir: string;
  readonly shots: readonly ShotCheck[];
  readonly emlDir: string;
}

/** Writes the emulated pages, their screenshots and the Apple Mail sandbox project. */
export async function runClientChecks(
  outDir: string,
  chromePath: string,
): Promise<ClientRunResult> {
  await mkdir(join(outDir, "png"), { recursive: true });
  const own = /-(gmail-a|gmail-b|outlook)(-\d+)?\.(html|png)$/;
  for (const dir of [outDir, join(outDir, "png")]) {
    for (const entry of await readdir(dir)) {
      if (own.test(entry)) await rm(join(dir, entry), { force: true });
    }
  }
  await rm(join(outDir, "results.json"), { force: true });
  const pairs = allPairs();
  for (const theme of new Set(pairs.map((p) => p.theme))) {
    await cp(join(root, "assets", theme.id), join(outDir, "assets", theme.id), {
      recursive: true,
    }).catch(() => undefined);
  }
  const emlDir = join(here, "apple-mail", "eml");
  await mkdir(emlDir, { recursive: true });

  const pages: { name: string; client: Client; width: number; file: string }[] = [];
  for (const pair of pairs) {
    const rendered = renderMail(pair.theme, samples[pair.sample](pair.theme.lang));
    await writeFile(
      join(emlDir, `${pair.name}.eml`),
      buildEml({ subject: rendered.subject, html: rendered.html, text: rendered.text }),
    );
    for (const variant of VARIANTS) {
      const file = join(outDir, `${pair.name}-${variant.client}.html`);
      await writeFile(file, mapAssetUrls(variant.emulate(rendered.html), pair.theme));
      for (const width of variant.widths) {
        pages.push({ name: pair.name, client: variant.client, width, file });
      }
    }
  }

  const shots: ShotCheck[] = [];
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--mute-audio", "--hide-scrollbars", "--disable-gpu"],
  });
  try {
    for (const p of pages) {
      const context = await browser.newContext({
        viewport: { width: p.width, height: 800 },
        colorScheme: "light",
        deviceScaleFactor: 1,
      });
      await context.route("**/*", (route) =>
        route.request().url().startsWith("file:") || route.request().url().startsWith("data:")
          ? route.continue()
          : route.abort(),
      );
      const page = await context.newPage();
      await page.goto(`file://${p.file}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const png = join(outDir, "png", `${p.name}-${p.client}-${p.width}.png`);
      await page.screenshot({ path: png, fullPage: true });
      shots.push({ name: p.name, client: p.client, width: p.width, png, ...(await measure(page)) });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  await writeFile(join(outDir, "results.json"), `${JSON.stringify(shots, null, 2)}\n`);
  return { outDir, shots, emlDir };
}

/** Names of the committed .eml files that differ from what renderMail produces now. */
export async function staleEmlFiles(): Promise<string[]> {
  const stale: string[] = [];
  for (const pair of allPairs()) {
    const rendered = renderMail(pair.theme, samples[pair.sample](pair.theme.lang));
    const expected = buildEml({
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    const file = join(here, "apple-mail", "eml", `${pair.name}.eml`);
    if ((await readFile(file, "utf8").catch(() => "")) !== expected) stale.push(`${pair.name}.eml`);
  }
  return stale;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--verify")) {
  const stale = await staleEmlFiles();
  if (stale.length > 0) {
    console.error(`stale .eml files (run node test/clients/run.ts): ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log("the .eml files match renderMail");
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const chromePath = findBrowser();
  if (!chromePath) {
    console.error(missingBrowserMessage());
    process.exit(2);
  }
  const outDir = resolve(
    process.argv.slice(2).find((a) => !a.startsWith("--")) ?? join(root, "preview", "clients"),
  );
  const result = await runClientChecks(outDir, chromePath);
  console.log(`${result.shots.length} screenshots in ${join(outDir, "png")}`);
  console.log(`Apple Mail .eml files:${result.emlDir}`);
}
