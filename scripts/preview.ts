import { existsSync, readdirSync } from "node:fs";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { renderMail } from "../src/render-mail.ts";
import { samples } from "../src/samples.ts";
import { builtInThemes } from "../src/themes/index.ts";
import type { MailContent, RenderedMail, SampleName, Theme } from "../src/types.ts";

export const INSTALL_COMMAND = "npx playwright install chromium-headless-shell";

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
} as const;
export type ViewName = keyof typeof VIEWPORTS;
export type Scheme = "light" | "dark";

const root = fileURLToPath(new URL("..", import.meta.url));

export function findBrowser(env: NodeJS.ProcessEnv = process.env, home = homedir()): string | null {
  const fromEnv = env.CCS_TEST_CHROME;
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  const cache = join(home, "Library", "Caches", "ms-playwright");
  const bases = [cache, join(home, ".cache", "ms-playwright")];
  const found: string[] = [];
  for (const base of bases) {
    if (!existsSync(base)) continue;
    for (const dir of readdirSync(base)) {
      if (!dir.startsWith("chromium_headless_shell-")) continue;
      for (const sub of readdirSync(join(base, dir))) {
        for (const name of ["chrome-headless-shell", "headless_shell"]) {
          const candidate = join(base, dir, sub, name);
          if (existsSync(candidate)) found.push(candidate);
        }
      }
    }
  }
  return found.sort().at(-1) ?? null;
}

export interface Shot {
  readonly url: string;
  readonly png: string;
  readonly scheme: Scheme;
  readonly view: ViewName;
}

export interface ShotResult {
  readonly blockedRequests: string[];
}

/** One browser for a list of screenshots; every non-file request is refused and reported. */
export async function takeScreenshots(
  chromePath: string,
  shots: readonly Shot[],
): Promise<ShotResult> {
  const blockedRequests: string[] = [];
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--mute-audio", "--hide-scrollbars", "--disable-gpu"],
  });
  try {
    for (const shot of shots) {
      const context = await browser.newContext({
        viewport: VIEWPORTS[shot.view],
        colorScheme: shot.scheme,
        deviceScaleFactor: 1,
      });
      await context.route("**/*", (route) => {
        const target = route.request().url();
        if (target.startsWith("file:") || target.startsWith("data:")) return route.continue();
        blockedRequests.push(target);
        return route.abort();
      });
      const page = await context.newPage();
      await page.goto(shot.url, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.screenshot({ path: shot.png });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return { blockedRequests };
}

export interface Pair {
  readonly theme: Theme;
  readonly sample: SampleName;
  readonly name: string;
}

export function allPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const theme of Object.values(builtInThemes)) {
    for (const sample of Object.keys(samples) as SampleName[]) {
      pairs.push({ theme, sample, name: `${theme.id}-${sample}` });
    }
  }
  return pairs;
}

/** Local path under `assets/` for each logo and font URL of the theme, by file name. */
export function assetMap(theme: Theme): Map<string, string> {
  const map = new Map<string, string>();
  const urls = [...(theme.logo ? [theme.logo.url] : []), ...theme.webFonts.map((f) => f.url)];
  for (const url of urls) {
    const file = basename(new URL(url).pathname);
    const themeDir = join(root, "assets", theme.id);
    const candidates = [file, `fonts/${file}`];
    const local = candidates.find((c) => existsSync(join(themeDir, c)));
    if (local) map.set(url, `assets/${theme.id}/${local}`);
  }
  return map;
}

export function mapAssetUrls(html: string, theme: Theme): string {
  let out = html;
  for (const [url, local] of assetMap(theme)) out = out.split(url).join(local);
  return out;
}

export type Renderer = (theme: Theme, content: MailContent) => RenderedMail;

export interface PreviewOptions {
  readonly outDir?: string;
  readonly render?: Renderer;
  /** `undefined` looks the browser up; `null` forces "no browser". */
  readonly chromePath?: string | null;
  readonly only?: readonly string[];
  readonly png?: boolean;
}

export interface PreviewResult {
  readonly outDir: string;
  readonly pairs: readonly string[];
  readonly pngs: readonly string[];
  readonly missingBrowser: boolean;
  readonly blockedRequests: readonly string[];
}

function indexHtml(pairs: readonly Pair[], withPng: boolean): string {
  const rows = pairs
    .map((p) => {
      const png = ["light", "dark"]
        .flatMap((s) =>
          (Object.keys(VIEWPORTS) as ViewName[]).map(
            (v) => `<a href="png/${p.name}-${s}-${v}.png">${s} ${v}</a>`,
          ),
        )
        .join(" · ");
      return `<tr><td>${p.theme.id}</td><td>${p.sample}</td><td><a href="${p.name}.html">html</a> · <a href="${p.name}.txt">txt</a></td>${withPng ? `<td>${png}</td>` : ""}</tr>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>mail-kit preview</title>
<style>body{font-family:system-ui,sans-serif;margin:24px}td,th{padding:4px 12px;text-align:left}</style></head>
<body><h1>mail-kit preview</h1>
<table><thead><tr><th>Theme</th><th>Sample</th><th>Files</th>${withPng ? "<th>PNG</th>" : ""}</tr></thead>
<tbody>
${rows}
</tbody></table></body></html>
`;
}

export async function buildPreview(options: PreviewOptions = {}): Promise<PreviewResult> {
  const outDir = options.outDir ?? join(root, "preview");
  const render = options.render ?? renderMail;
  const pairs = allPairs().filter((p) => !options.only || options.only.includes(p.name));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, "png"), { recursive: true });

  for (const theme of new Set(pairs.map((p) => p.theme))) {
    if (!existsSync(join(root, "assets", theme.id))) continue;
    await cp(join(root, "assets", theme.id), join(outDir, "assets", theme.id), {
      recursive: true,
    });
  }
  for (const p of pairs) {
    const rendered = render(p.theme, samples[p.sample](p.theme.lang));
    await writeFile(join(outDir, `${p.name}.html`), mapAssetUrls(rendered.html, p.theme));
    await writeFile(join(outDir, `${p.name}.txt`), rendered.text);
  }
  await writeFile(join(outDir, "index.html"), indexHtml(pairs, options.png !== false));

  if (options.png === false) {
    return {
      outDir,
      pairs: pairs.map((p) => p.name),
      pngs: [],
      missingBrowser: false,
      blockedRequests: [],
    };
  }
  const chromePath = options.chromePath === undefined ? findBrowser() : options.chromePath;
  if (!chromePath) {
    return {
      outDir,
      pairs: pairs.map((p) => p.name),
      pngs: [],
      missingBrowser: true,
      blockedRequests: [],
    };
  }
  const shots: Shot[] = [];
  for (const p of pairs) {
    for (const scheme of ["light", "dark"] as const) {
      for (const view of Object.keys(VIEWPORTS) as ViewName[]) {
        shots.push({
          url: `file://${join(outDir, `${p.name}.html`)}`,
          png: join(outDir, "png", `${p.name}-${scheme}-${view}.png`),
          scheme,
          view,
        });
      }
    }
  }
  const { blockedRequests } = await takeScreenshots(chromePath, shots);
  return {
    outDir,
    pairs: pairs.map((p) => p.name),
    pngs: shots.map((s) => s.png),
    missingBrowser: false,
    blockedRequests,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outIndex = process.argv.indexOf("--out");
  const outDir = outIndex > 0 ? process.argv[outIndex + 1] : undefined;
  const result = await buildPreview(outDir ? { outDir } : {});
  if (result.missingBrowser) {
    console.error(
      `No headless Chromium found. html and txt were written to ${result.outDir}.\nInstall it with: ${INSTALL_COMMAND}`,
    );
    process.exit(1);
  }
  console.log(
    `preview: ${result.pairs.length} mails, ${result.pngs.length} PNGs in ${result.outDir}`,
  );
}
