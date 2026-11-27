import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildPreview, findBrowser, takeScreenshots } from "../scripts/preview.ts";
import { renderHtml } from "../src/html/index.ts";
import { samples } from "../src/samples.ts";
import { dreamStudio } from "../src/themes/dream-studio.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const images = join(root, "spec", "images");
const chromePath = findBrowser();

const THRESHOLD = 0.01;
const PIXEL_COLOR_TOLERANCE = 0.1;

const pairs = [
  { name: "majordome-magic-link", mockup: "05-majordome-magic-link" },
  { name: "dream-studio-code", mockup: "05-dream-studio-code" },
] as const;
const views = [
  { scheme: "light", view: "desktop", suffix: "" },
  { scheme: "dark", view: "desktop", suffix: "-dark" },
  { scheme: "light", view: "phone", suffix: "-phone" },
  { scheme: "dark", view: "phone", suffix: "-dark-phone" },
] as const;

function diffRatio(a: string, b: string): number {
  const pa = PNG.sync.read(readFileSync(a));
  const pb = PNG.sync.read(readFileSync(b));
  expect([pa.width, pa.height]).toEqual([pb.width, pb.height]);
  const bad = pixelmatch(pa.data, pb.data, undefined, pa.width, pa.height, {
    threshold: PIXEL_COLOR_TOLERANCE,
  });
  return bad / (pa.width * pa.height);
}

const t2Ready = (() => {
  try {
    renderHtml(dreamStudio, samples.code("en"));
    return true;
  } catch {
    return false;
  }
})();

let tmp: string;
beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), "mail-kit-mockup-"));
});
afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe.skipIf(!chromePath)("F2.7 pixel match with the mockups", () => {
  it("harness: the mockup html screenshotted here matches the committed mockup PNGs", async () => {
    const shots = pairs.flatMap((p) =>
      views.map((v) => ({
        url: `file://${join(root, "spec", "images", "src", `${p.mockup}.html`)}`,
        png: join(tmp, `harness-${p.mockup}${v.suffix}.png`),
        committed: join(images, `${p.mockup}${v.suffix}.png`),
        scheme: v.scheme,
        view: v.view,
      })),
    );
    await takeScreenshots(chromePath as string, shots);
    for (const s of shots) {
      expect(diffRatio(s.png, s.committed), s.png).toBeLessThan(THRESHOLD);
    }
  }, 120_000);

  it.skipIf(!t2Ready)(
    "F2.7 mail-kit renders differ from the mockups by under 1 % of pixels",
    async () => {
      const out = join(tmp, "preview");
      await buildPreview({ outDir: out, only: pairs.map((p) => p.name), chromePath });
      for (const p of pairs) {
        for (const v of views) {
          const mine = join(out, "png", `${p.name}-${v.scheme}-${v.view}.png`);
          const ref = join(images, `${p.mockup}${v.suffix}.png`);
          expect(diffRatio(mine, ref), `${p.name} ${v.scheme} ${v.view}`).toBeLessThan(THRESHOLD);
        }
      }
    },
    180_000,
  );

  // Waiting for T2: the real renderHtml is still the placeholder (listed in spec/decisions/T5.md).
  it.skipIf(t2Ready)("F2.7 mail-kit comparison: waiting for T2", () => {
    expect(t2Ready).toBe(false);
  });
});
