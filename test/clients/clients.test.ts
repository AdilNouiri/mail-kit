import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { allPairs } from "../../scripts/preview.ts";
import { renderMail } from "../../src/render-mail.ts";
import { samples } from "../../src/samples.ts";
import { buildEml } from "./eml.ts";
import { emulateGmailWebA, emulateGmailWebB, emulateOutlookCom } from "./emulate.ts";

const SOURCE = `<!doctype html><html><head><style>
@font-face{font-family:'X';src:url('https://example.com/x.woff2')}
body{margin:0;box-shadow:0 0 4px #000}
a[x-apple-data-detectors]{color:inherit}
@media (max-width: 620px){.mk-pad{padding:0 !important}}
@media (prefers-color-scheme: dark){.mk-card{background:#000 !important}}
[data-ogsc] .mk-card{color:#fff}
.mk-card:hover{color:red}
</style></head><body class="mk-body"><div class="mk-card mk-pad" style="color-scheme:light dark;margin:-4px;padding:8px;box-shadow:0 0 1px #000">x</div></body></html>`;

describe("F8.3 Gmail web emulation (rules of spec/decisions/T12.md)", () => {
  it("variant A removes dark rules, @font-face, attribute selectors and unsupported properties", () => {
    const out = emulateGmailWebA(SOURCE);
    expect(out).not.toMatch(/prefers-color-scheme/);
    expect(out).not.toMatch(/@font-face/);
    expect(out).not.toMatch(/data-ogsc|x-apple-data-detectors/);
    expect(out).not.toMatch(/box-shadow|color-scheme:|margin:-4px/);
    expect(out).toContain("padding:8px");
    expect(out).toMatch(/@media \(max-width: 620px\)\{\.mk-pad\{padding:0 !important\}\}/);
    expect(out).toContain(".mk-card:hover");
  });

  it("variant A drops the whole style block above 16384 characters", () => {
    const big = `<style>.a{color:red}${"/*x*/".repeat(3300)}</style><p class="a">x</p>`;
    expect(emulateGmailWebA(big)).not.toContain("<style");
  });

  it("variant B removes every style block and keeps the inline styles", () => {
    const out = emulateGmailWebB(SOURCE);
    expect(out).not.toContain("<style");
    expect(out).toContain("padding:8px");
  });
});

describe("F8.5 Outlook.com emulation", () => {
  it("prefixes every class in the markup and the selectors with x_", () => {
    const out = emulateOutlookCom(SOURCE);
    expect(out).toContain('class="x_mk-card x_mk-pad"');
    expect(out).toContain('class="x_mk-body"');
    expect(out).toContain(".x_mk-pad{padding:0 !important}");
    expect(out).not.toMatch(/@font-face|color-scheme:light/);
  });

  it("keeps the prefers-color-scheme rules, which caniemail documents as supported", () => {
    expect(emulateOutlookCom(SOURCE)).toContain("prefers-color-scheme: dark");
  });
});

describe("emulations over every built-in pair", () => {
  for (const pair of allPairs()) {
    it(`${pair.name}: banner, footer and the inline layout survive`, () => {
      const html = renderMail(pair.theme, samples[pair.sample](pair.theme.lang)).html;
      for (const out of [emulateGmailWebA(html), emulateGmailWebB(html), emulateOutlookCom(html)]) {
        expect(out).toMatch(/mk-banner/);
        expect(out).toMatch(/mk-footer/);
        expect(out).toContain(`bgcolor="${pair.theme.colors.brand}"`);
        expect(out).toContain(`background:${pair.theme.colors.brand}`);
      }
    });
  }
});

describe("F8.4 .eml files", () => {
  for (const pair of allPairs()) {
    it(`${pair.name}.eml matches the rendered mail (run node test/clients/run.ts after a change)`, () => {
      const rendered = renderMail(pair.theme, samples[pair.sample](pair.theme.lang));
      const file = fileURLToPath(new URL(`apple-mail/eml/${pair.name}.eml`, import.meta.url));
      expect(readFileSync(file, "utf8")).toBe(
        buildEml({ subject: rendered.subject, html: rendered.html, text: rendered.text }),
      );
    });
  }

  it("is multipart/alternative with a text then an html part", () => {
    const eml = buildEml({ subject: "Sujet é", html: "<p>x</p>", text: "x" });
    expect(eml).toContain("multipart/alternative");
    expect(eml.indexOf("text/plain")).toBeLessThan(eml.indexOf("text/html"));
    expect(eml).toContain(`Subject: =?UTF-8?B?${Buffer.from("Sujet é").toString("base64")}?=`);
  });
});
