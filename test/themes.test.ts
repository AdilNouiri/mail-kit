import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { samples } from "../src/samples.ts";
import { dreamStudio, dreamStudioInput } from "../src/themes/dream-studio.ts";
import { majordome, majordomeInput } from "../src/themes/majordome.ts";

type Entry = Record<string, ReturnType<typeof JSON.parse>>;
const entries = JSON.parse(
  readFileSync(new URL("../spec/images/src/themes.json", import.meta.url), "utf8"),
) as Entry[];
const entry = (id: string): Entry => entries.find((e) => e.id === id) as Entry;

function shared(e: Entry) {
  return {
    id: e.id,
    lang: e.lang,
    wordmark: e.wordmark,
    colors: e.colors,
    dark: e.dark,
    fonts: e.fonts,
    buttonRadius: e.buttonRadius,
    footer: e.footer,
  };
}

describe("F7.1 Majordome theme", () => {
  it("equals its themes.json entry", () => {
    const e = entry("majordome");
    const { webFonts, logo, ...rest } = majordomeInput;
    expect(rest).toEqual(shared(e));
    expect(logo).toEqual({
      url: "https://majordomeapp.fr/media/mail-logo.png",
      width: e.logo.width,
      height: e.logo.height,
    });
    const faces = [
      ...String(e.webFonts).matchAll(
        /font-family:'([^']+)';src:url\(assets\/([^)]+)\)[^}]*font-weight:(\d+)/g,
      ),
    ];
    expect(faces).toHaveLength(3);
    expect(webFonts).toEqual(
      faces.map((m) => ({
        family: m[1],
        url: `https://majordomeapp.fr/fonts/${m[2]}`,
        weight: Number(m[3]),
      })),
    );
    expect(rest.lang).toBe("fr");
  });
});

describe("F7.2 Dream Studio theme", () => {
  it("equals its themes.json entry, with no logo", () => {
    const e = entry("dream-studio");
    const { wordmarkSpacing, ...rest } = dreamStudioInput;
    expect(rest).toEqual(shared(e));
    expect(wordmarkSpacing).toBe(Number.parseInt(e.wordmarkSpacing, 10));
    expect(dreamStudioInput.logo).toBeUndefined();
  });
});

describe("F7.3 logo files", () => {
  it("mail-logo.png is 96 x 56", () => {
    const png = readFileSync(new URL("../assets/majordome/mail-logo.png", import.meta.url));
    expect(png.readUInt32BE(16)).toBe(96);
    expect(png.readUInt32BE(20)).toBe(56);
  });
});

describe("F1.6 built-in themes pass defineTheme", () => {
  it("each built-in theme is a frozen defineTheme result of its input", () => {
    for (const [theme, input] of [
      [majordome, majordomeInput],
      [dreamStudio, dreamStudioInput],
    ] as const) {
      expect(theme.id).toBe(input.id);
      expect(theme.colors).toEqual(input.colors);
      expect(Object.isFrozen(theme)).toBe(true);
    }
    expect(dreamStudio.logo).toBeUndefined();
  });
});

describe("samples", () => {
  it("has magic-link, code and notice in fr and en", () => {
    for (const name of ["magic-link", "code", "notice"] as const) {
      for (const lang of ["fr", "en"] as const) {
        const mail = samples[name](lang);
        expect(mail.subject.length).toBeGreaterThan(0);
        expect(mail.blocks.length).toBeGreaterThan(0);
      }
    }
    expect(samples.notice("en").blocks.map((b) => b.type)).toEqual([
      "heading",
      "paragraph",
      "divider",
      "note",
    ]);
  });
});
