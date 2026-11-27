// Assumption: the headless test browser renders `prefers-color-scheme` from
// `--blink-settings=preferredColorScheme=<n>` (0 = dark, 1 = light), and Playwright's own
// emulation does the same. Run: `node test/assumptions/color-scheme.ts [executable...]`.
import { type Browser, chromium } from "playwright-core";

const PAGE = `<!doctype html><html><head><style>
body { background: #ffffff; }
@media (prefers-color-scheme: dark) { body { background: #000000; } }
</style></head><body>x</body></html>`;

interface Reading {
  readonly dark: boolean;
  readonly background: string;
}

async function read(browser: Browser, colorScheme: "light" | "dark" | null): Promise<Reading> {
  const context = await browser.newContext({ colorScheme });
  try {
    const page = await context.newPage();
    await page.setContent(PAGE);
    return await page.evaluate(() => ({
      dark: matchMedia("(prefers-color-scheme: dark)").matches,
      background: getComputedStyle(document.body).backgroundColor,
    }));
  } finally {
    await context.close();
  }
}

async function probe(label: string, executablePath: string | undefined): Promise<boolean> {
  let ok = true;
  const expect = (what: string, reading: Reading, dark: boolean) => {
    const pass =
      reading.dark === dark &&
      reading.background === (dark ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)");
    ok &&= pass;
    console.log(
      `${pass ? "ok  " : "FAIL"} ${label}: ${what} -> dark=${reading.dark} ${reading.background}`,
    );
  };
  for (const setting of [0, 1] as const) {
    let browser: Browser;
    try {
      browser = await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [`--blink-settings=preferredColorScheme=${setting}`, "--mute-audio"],
      });
    } catch (error) {
      console.log(`skip ${label}: ${(error as Error).message.split("\n")[0]}`);
      return true;
    }
    try {
      const version = browser.version();
      expect(
        `v${version} flag=${setting}, emulation off`,
        await read(browser, null),
        setting === 0,
      );
      expect(`v${version} flag=${setting}, emulation dark`, await read(browser, "dark"), true);
      expect(`v${version} flag=${setting}, emulation light`, await read(browser, "light"), false);
    } finally {
      await browser.close();
    }
  }
  return ok;
}

const targets: [string, string | undefined][] = [
  ["CCS_TEST_CHROME", process.env.CCS_TEST_CHROME],
  ["playwright-core default headless shell", undefined],
  ...process.argv.slice(2).map((path): [string, string] => [path, path]),
];
let allOk = true;
for (const [label, path] of targets) {
  if (label === "CCS_TEST_CHROME" && !path) continue;
  allOk = (await probe(label, path)) && allOk;
}
process.exit(allOk ? 0 : 1);
