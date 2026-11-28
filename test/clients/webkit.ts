import { cp, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright-core";
import { allPairs, mapAssetUrls } from "../../scripts/preview.ts";
import { renderMail } from "../../src/render-mail.ts";
import { samples } from "../../src/samples.ts";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

/**
 * F8.4 fallback: Apple Mail renders html with WebKit, so the unmodified mails are shown in
 * Playwright's WebKit, headless, light then dark. Reported as emulated, never as Apple Mail's
 * own renderer.
 */
export async function runWebkitShots(outDir: string): Promise<string[]> {
  await mkdir(join(outDir, "png"), { recursive: true });
  const pngs: string[] = [];
  const browser = await webkit.launch({ headless: true });
  try {
    for (const pair of allPairs()) {
      await cp(join(root, "assets", pair.theme.id), join(outDir, "assets", pair.theme.id), {
        recursive: true,
      }).catch(() => undefined);
      const rendered = renderMail(pair.theme, samples[pair.sample](pair.theme.lang));
      const file = join(outDir, `${pair.name}-applemail-webkit.html`);
      await writeFile(file, mapAssetUrls(rendered.html, pair.theme));
      for (const scheme of ["light", "dark"] as const) {
        for (const width of [1280, 390]) {
          const context = await browser.newContext({
            viewport: { width, height: 800 },
            colorScheme: scheme,
          });
          await context.route("**/*", (route) =>
            route.request().url().startsWith("file:") ? route.continue() : route.abort(),
          );
          const page = await context.newPage();
          await page.goto(`file://${file}`, { waitUntil: "load" });
          const png = join(outDir, "png", `${pair.name}-applemail-webkit-${scheme}-${width}.png`);
          await page.screenshot({ path: png, fullPage: true });
          pngs.push(png);
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  return pngs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outDir = resolve(process.argv[2] ?? join(root, "preview", "clients"));
  const pngs = await runWebkitShots(outDir);
  console.log(`${pngs.length} WebKit screenshots in ${join(outDir, "png")}`);
}
