import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright-core";

/** `$CCS_TEST_CHROME` when set, else Playwright's newest chromium-headless-shell. */
export function headlessExecutable(): string {
  const fromEnv = process.env.CCS_TEST_CHROME;
  if (fromEnv) return fromEnv;
  const cache = join(homedir(), "Library", "Caches", "ms-playwright");
  const linuxCache = join(homedir(), ".cache", "ms-playwright");
  for (const root of [cache, linuxCache]) {
    if (!existsSync(root)) continue;
    const shells = readdirSync(root)
      .filter((name) => name.startsWith("chromium_headless_shell-"))
      .sort()
      .reverse();
    for (const shell of shells) {
      for (const platform of readdirSync(join(root, shell))) {
        const binary = join(root, shell, platform, "chrome-headless-shell");
        if (existsSync(binary)) return binary;
      }
    }
  }
  throw new Error(
    "No headless Chromium: set CCS_TEST_CHROME or run `npx playwright-core install chromium-headless-shell`.",
  );
}

export function launch(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    executablePath: headlessExecutable(),
    args: ["--mute-audio"],
  });
}

/** Opens the html in a fresh context with no network: logo and web fonts are not fetched. */
export async function open(
  browser: Browser,
  html: string,
  options: { colorScheme: "light" | "dark"; width: number; height: number },
): Promise<Page> {
  const context = await browser.newContext({
    colorScheme: options.colorScheme,
    viewport: { width: options.width, height: options.height },
  });
  await context.route("**/*", (route) => route.abort());
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  return page;
}
