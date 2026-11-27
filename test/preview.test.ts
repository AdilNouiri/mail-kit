import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  allPairs,
  buildPreview,
  checkOutDir,
  findBrowser,
  INSTALL_COMMAND,
  missingBrowserMessage,
  type PreviewResult,
  type Renderer,
} from "../scripts/preview.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const chromePath = findBrowser();

// Stands in for T2's renderer: carries the theme's logo and web font URLs and a dark rule.
const stubRender: Renderer = (theme, content) => {
  const fonts = theme.webFonts
    .map(
      (f) =>
        `@font-face{font-family:'${f.family}';src:url(${f.url}) format('woff2');font-weight:${f.weight}}`,
    )
    .join("");
  const logo = theme.logo ? `<img src="${theme.logo.url}" width="48" height="28" alt="">` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
body{margin:0;background:#fff}@media (prefers-color-scheme: dark){body{background:#000}}</style></head>
<body>${logo}<h1>${content.subject}</h1><a href="https://example.com/x">link</a></body></html>`;
  return { subject: content.subject, html, text: `${content.subject}\n` };
};

let tmp: string;
let result: PreviewResult;

beforeAll(async () => {
  if (!chromePath) throw new Error(missingBrowserMessage());
  tmp = mkdtempSync(join(tmpdir(), "mail-kit-preview-"));
  result = await buildPreview({ outDir: join(tmp, "out"), render: stubRender, chromePath });
}, 240_000);
afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

const out = () => join(tmp, "out");

describe("F5.1 every theme x sample", () => {
  it("writes one html and one txt per pair and an index that links them all", () => {
    const pairs = allPairs();
    expect(pairs).toHaveLength(6);
    const index = readFileSync(join(out(), "index.html"), "utf8");
    for (const p of pairs) {
      expect(existsSync(join(out(), `${p.name}.html`)), p.name).toBe(true);
      expect(existsSync(join(out(), `${p.name}.txt`)), p.name).toBe(true);
      expect(index).toContain(`href="${p.name}.html"`);
      expect(index).toContain(`href="${p.name}.txt"`);
    }
  });
});

describe("F5.2 PNGs in four views", () => {
  it("writes light and dark PNGs at 1280x800 and 390x844 per pair", () => {
    const sizes = { desktop: [1280, 800], phone: [390, 844] } as const;
    for (const p of allPairs()) {
      for (const scheme of ["light", "dark"]) {
        for (const view of ["desktop", "phone"] as const) {
          const file = join(out(), "png", `${p.name}-${scheme}-${view}.png`);
          const png = PNG.sync.read(readFileSync(file));
          expect([png.width, png.height], file).toEqual(sizes[view]);
        }
      }
    }
    expect(readdirSync(join(out(), "png"))).toHaveLength(24);
  });

  it("applies the colour scheme of the context", () => {
    const pixel = (file: string) => PNG.sync.read(readFileSync(file)).data.subarray(0, 3);
    const base = join(out(), "png", "dream-studio-code");
    expect([...pixel(`${base}-light-desktop.png`)]).toEqual([255, 255, 255]);
    expect([...pixel(`${base}-dark-desktop.png`)]).toEqual([0, 0, 0]);
  });
});

describe("F5.3 runs offline", () => {
  it("maps logo and font URLs to assets/ and requests nothing from the network", () => {
    const html = readFileSync(join(out(), "majordome-magic-link.html"), "utf8");
    expect(html).not.toContain("https://majordomeapp.fr");
    expect(html).toContain("assets/majordome/mail-logo.png");
    expect(html).toContain("assets/majordome/fonts/Gloock-Regular.woff2");
    expect(existsSync(join(out(), "assets", "majordome", "mail-logo.png"))).toBe(true);
    expect(existsSync(join(out(), "assets", "majordome", "fonts", "Figtree-SemiBold.woff2"))).toBe(
      true,
    );
    expect(result.blockedRequests).toEqual([]);
  });
});

describe("F5 no headless Chromium", () => {
  it("still writes html, txt and index, and reports the missing browser", async () => {
    const dir = join(tmp, "nobrowser");
    const r = await buildPreview({ outDir: dir, render: stubRender, chromePath: null });
    expect(r.missingBrowser).toBe(true);
    expect(existsSync(join(dir, "index.html"))).toBe(true);
    expect(existsSync(join(dir, "dream-studio-notice.txt"))).toBe(true);
    expect(INSTALL_COMMAND).toBe("npx playwright install chromium-headless-shell");
  });

  it("finds no browser in an empty home without CCS_TEST_CHROME", () => {
    expect(findBrowser({}, join(tmp, "empty-home"))).toBeNull();
    expect(findBrowser({ CCS_TEST_CHROME: join(tmp, "missing") }, tmp)).toBeNull();
  });

  it("picks the highest browser revision numerically", () => {
    const home = join(tmp, "revisions");
    for (const rev of ["999", "1000"]) {
      const dir = join(
        home,
        "Library",
        "Caches",
        "ms-playwright",
        `chromium_headless_shell-${rev}`,
        "x",
      );
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "chrome-headless-shell"), "");
    }
    expect(findBrowser({}, home)).toContain("chromium_headless_shell-1000");
  });

  it("names CCS_TEST_CHROME when it is set but missing", () => {
    const message = missingBrowserMessage({ CCS_TEST_CHROME: "/nowhere/chrome" });
    expect(message).toContain("CCS_TEST_CHROME");
    expect(message).toContain(INSTALL_COMMAND);
  });

  it("the command exits 1 with the install command when no browser is found", () => {
    const dir = join(root, "preview", `cli-test-${process.pid}`);
    try {
      const env = { PATH: process.env.PATH, HOME: join(tmp, "empty-home") };
      const run = spawnSync(process.execPath, [join(root, "scripts", "preview.ts"), "--out", dir], {
        env,
        encoding: "utf8",
      });
      expect(run.status).toBe(1);
      expect(run.stderr).toContain(INSTALL_COMMAND);
      expect(existsSync(join(dir, "index.html"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("F5 --out guard", () => {
  it("refuses the repository root, '.' and a folder outside the repository", () => {
    for (const bad of [root, ".", "..", tmp]) {
      expect(() => checkOutDir(bad), bad).toThrow("--out must be a folder inside the repository");
    }
    expect(checkOutDir(join(root, "preview"))).toBe(join(root, "preview"));
  });

  it("the command exits 2 before writing anything", () => {
    const run = spawnSync(process.execPath, [join(root, "scripts", "preview.ts"), "--out", root], {
      encoding: "utf8",
    });
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("--out must be a folder inside the repository");
  });
});
