import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { labelled, stringsFor } from "../src/i18n.ts";
import { defineTheme } from "../src/theme.ts";
import { ThemeError, type ThemeInput } from "../src/types.ts";

interface RawTheme extends Record<string, unknown> {
  id: string;
  logo?: { src: string; width: number; height: number };
  webFonts?: string;
}

const raw = JSON.parse(
  readFileSync(new URL("../spec/images/src/themes.json", import.meta.url), "utf8"),
) as RawTheme[];

function toInput(theme: RawTheme): ThemeInput {
  const { sample: _sample, logo, webFonts: _webFonts, ...rest } = theme;
  const input: Record<string, unknown> = { ...rest };
  if (typeof rest.wordmarkSpacing === "string") {
    input.wordmarkSpacing = Number.parseFloat(rest.wordmarkSpacing);
  }
  if (logo) {
    input.logo = { url: "https://example.com/logo.png", width: logo.width, height: logo.height };
  }
  return input as unknown as ThemeInput;
}

function base(): ThemeInput {
  const theme = raw.find((entry) => entry.id === "majordome");
  if (!theme) throw new Error("majordome missing from themes.json");
  const input = toInput(theme) as unknown as Record<string, unknown>;
  const { lang: _lang, buttonRadius: _radius, ...rest } = input;
  return structuredClone(rest) as unknown as ThemeInput;
}

function mutate(change: (input: Record<string, any>) => void): ThemeInput {
  const input = structuredClone(base()) as unknown as Record<string, any>;
  change(input);
  return input as unknown as ThemeInput;
}

function pathOf(input: ThemeInput): string {
  try {
    defineTheme(input);
  } catch (error) {
    expect(error).toBeInstanceOf(ThemeError);
    return (error as ThemeError).path;
  }
  throw new Error("defineTheme accepted the theme");
}

function isDeeplyFrozen(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeeplyFrozen);
}

describe("F1.1 valid theme accepted", () => {
  it("returns a deeply frozen theme equal to the input plus defaults", () => {
    const input = base();
    const theme = defineTheme(input);
    expect(theme).toEqual({
      ...input,
      wordmarkSpacing: 0,
      lang: "en",
      buttonRadius: 8,
      fonts: { ...input.fonts, displayWeight: 400 },
      webFonts: [],
    });
    expect(isDeeplyFrozen(theme)).toBe(true);
  });

  it("fills displayWeight 700 and keeps explicit values", () => {
    const theme = defineTheme(
      mutate((input) => {
        delete input.fonts.displayWeight;
        input.lang = "fr";
        input.buttonRadius = 999;
        input.wordmarkSpacing = 3;
      }),
    );
    expect(theme.fonts.displayWeight).toBe(700);
    expect(theme.lang).toBe("fr");
    expect(theme.buttonRadius).toBe(999);
    expect(theme.wordmarkSpacing).toBe(3);
  });

  it("does not share objects with the input", () => {
    const input = base();
    const theme = defineTheme(input);
    expect(theme.colors).not.toBe(input.colors);
    expect(Object.isFrozen(input.colors)).toBe(false);
  });

  it("leaves logo and footer.link absent when absent", () => {
    const theme = defineTheme(
      mutate((input) => {
        delete input.logo;
        delete input.footer.link;
      }),
    );
    expect("logo" in theme).toBe(false);
    expect("link" in theme.footer).toBe(false);
  });
});

describe("F1.2 bad colour rejected", () => {
  it.each(["red", "#c83", "#12345g", "#1234567", "c8372d"])("rejects %s", (value) => {
    expect(pathOf(mutate((input) => (input.colors.accent = value)))).toBe("colors.accent");
  });

  it("rejects a bad dark colour on its own path", () => {
    expect(pathOf(mutate((input) => (input.dark.card = "black")))).toBe("dark.card");
  });

  it("rejects a missing colour", () => {
    expect(pathOf(mutate((input) => delete input.colors.link))).toBe("colors.link");
  });
});

describe("F1.3 logo must be absolute HTTPS PNG or JPEG", () => {
  it.each([
    "/assets/logo.png",
    "assets/logo.png",
    "http://example.com/logo.png",
    "https://example.com/logo.svg",
    "https://example.com/logo.gif",
  ])("rejects %s", (url) => {
    expect(pathOf(mutate((input) => (input.logo.url = url)))).toBe("logo.url");
  });

  it.each([
    "https://example.com/a.png",
    "https://example.com/a.JPG",
    "https://example.com/a.jpeg?v=2",
  ])("accepts %s", (url) => {
    expect(() => defineTheme(mutate((input) => (input.logo.url = url)))).not.toThrow();
  });

  it("checks the logo size ranges", () => {
    expect(pathOf(mutate((input) => (input.logo.width = 15)))).toBe("logo.width");
    expect(pathOf(mutate((input) => (input.logo.width = 201)))).toBe("logo.width");
    expect(pathOf(mutate((input) => (input.logo.height = 81)))).toBe("logo.height");
  });
});

describe("F1.4 contrast checked", () => {
  function contrastError(input: ThemeInput): ThemeError {
    try {
      defineTheme(input);
    } catch (error) {
      return error as ThemeError;
    }
    throw new Error("defineTheme accepted the theme");
  }

  it("names the pair and the ratio for onAccent on accent", () => {
    const error = contrastError(mutate((input) => (input.colors.onAccent = "#eeeeee")));
    expect(error.path).toBe("colors.onAccent");
    expect(error.message).toMatch(/colors\.onAccent on colors\.accent/);
    expect(error.message).toMatch(/\d\.\d\d/);
  });

  it("names the pair for text on card", () => {
    const error = contrastError(mutate((input) => (input.colors.text = "#f0f0f0")));
    expect(error.message).toMatch(/colors\.text on colors\.card/);
  });

  it("checks the other light pairs", () => {
    expect(pathOf(mutate((input) => (input.colors.onBrand = input.colors.brand)))).toBe(
      "colors.onBrand",
    );
    expect(pathOf(mutate((input) => (input.colors.textSoft = "#ffffff")))).toBe("colors.textSoft");
    expect(pathOf(mutate((input) => (input.colors.muted = "#eeeeee")))).toBe("colors.muted");
    expect(pathOf(mutate((input) => (input.colors.link = "#ffffff")))).toBe("colors.link");
    expect(pathOf(mutate((input) => (input.colors.footerText = input.colors.canvas)))).toBe(
      "colors.footerText",
    );
  });

  it("checks text and textSoft on subtle", () => {
    expect(pathOf(mutate((input) => (input.colors.subtle = "#222222")))).toBe("colors.text");
  });

  it("runs the same check on the dark colours", () => {
    expect(pathOf(mutate((input) => (input.dark.text = "#111111")))).toBe("dark.text");
    expect(pathOf(mutate((input) => (input.dark.muted = "#14332e")))).toBe("dark.muted");
    expect(pathOf(mutate((input) => (input.dark.link = "#14332e")))).toBe("dark.link");
    expect(pathOf(mutate((input) => (input.dark.subtle = "#ffffff")))).toBe("dark.text");
  });

  it("checks dark.muted on dark.canvas, the footer colour in dark mode", () => {
    const error = contrastError(mutate((input) => (input.dark.canvas = input.dark.muted)));
    expect(error.path).toBe("dark.muted");
    expect(error.message).toMatch(/dark\.muted on dark\.canvas/);
  });

  it("accepts a ratio of exactly the limit side (just above 4.5) and refuses just below", () => {
    expect(() => defineTheme(mutate((input) => (input.colors.muted = "#767676")))).not.toThrow();
    expect(pathOf(mutate((input) => (input.colors.muted = "#777777")))).toBe("colors.muted");
  });
});

describe("F1.5 fonts end with a generic family", () => {
  it.each(["Georgia", "'Gloock', Georgia, 'Times New Roman'", "Arial, cursive"])(
    "rejects display %s",
    (stack) => {
      expect(pathOf(mutate((input) => (input.fonts.display = stack)))).toBe("fonts.display");
    },
  );

  it("rejects a body stack without a generic family", () => {
    expect(pathOf(mutate((input) => (input.fonts.text = "Figtree, Arial")))).toBe("fonts.text");
  });

  it.each(["Georgia, serif", "Arial,SANS-SERIF", "Menlo, monospace"])("accepts %s", (stack) => {
    expect(() => defineTheme(mutate((input) => (input.fonts.display = stack)))).not.toThrow();
  });
});

describe("F1 edge cases and the other rules of 4.1", () => {
  it("rejects an unknown field at every level", () => {
    expect(pathOf(mutate((input) => (input.colour = "x")))).toBe("colour");
    expect(pathOf(mutate((input) => (input.colors.acent = "#ffffff")))).toBe("colors.acent");
    expect(pathOf(mutate((input) => (input.fonts.size = 12)))).toBe("fonts.size");
    expect(pathOf(mutate((input) => (input.footer.extra = "x")))).toBe("footer.extra");
    expect(pathOf(mutate((input) => (input.logo.src = "x")))).toBe("logo.src");
  });

  it("checks id, wordmark and spacing", () => {
    expect(pathOf(mutate((input) => (input.id = "Bad Id")))).toBe("id");
    expect(pathOf(mutate((input) => (input.id = "a")))).toBe("id");
    expect(pathOf(mutate((input) => (input.wordmark = "")))).toBe("wordmark");
    expect(pathOf(mutate((input) => (input.wordmark = "x".repeat(41))))).toBe("wordmark");
    expect(pathOf(mutate((input) => (input.wordmarkSpacing = 7)))).toBe("wordmarkSpacing");
    expect(pathOf(mutate((input) => (input.wordmarkSpacing = "3px")))).toBe("wordmarkSpacing");
  });

  it("checks lang, weight and radius", () => {
    expect(pathOf(mutate((input) => (input.lang = "de")))).toBe("lang");
    expect(pathOf(mutate((input) => (input.fonts.displayWeight = 500)))).toBe(
      "fonts.displayWeight",
    );
    expect(pathOf(mutate((input) => (input.buttonRadius = 1000)))).toBe("buttonRadius");
    expect(pathOf(mutate((input) => (input.buttonRadius = -1)))).toBe("buttonRadius");
  });

  it("checks the footer", () => {
    expect(pathOf(mutate((input) => (input.footer.reason = "")))).toBe("footer.reason");
    expect(pathOf(mutate((input) => (input.footer.reason = "x".repeat(301))))).toBe(
      "footer.reason",
    );
    expect(pathOf(mutate((input) => (input.footer.legal = "x".repeat(201))))).toBe("footer.legal");
    expect(pathOf(mutate((input) => (input.footer.link.url = "http://example.com/p")))).toBe(
      "footer.link.url",
    );
  });

  it("checks webFonts", () => {
    const font = { family: "Gloock", url: "https://example.com/g.woff2", weight: 400 };
    const theme = defineTheme(mutate((input) => (input.webFonts = [font])));
    expect(theme.webFonts).toEqual([font]);
    expect(pathOf(mutate((input) => (input.webFonts = [{ ...font, url: "assets/g.woff2" }])))).toBe(
      "webFonts[0].url",
    );
    expect(
      pathOf(mutate((input) => (input.webFonts = [{ ...font, url: "https://example.com/g.ttf" }]))),
    ).toBe("webFonts[0].url");
    expect(pathOf(mutate((input) => (input.webFonts = [{ ...font, weight: 450 }])))).toBe(
      "webFonts[0].weight",
    );
    expect(pathOf(mutate((input) => (input.webFonts = Array(5).fill(font))))).toBe("webFonts");
  });

  it("refuses a non-object input", () => {
    expect(() => defineTheme(null as unknown as ThemeInput)).toThrow(ThemeError);
  });
});

describe("F2.9 theme URLs stay https: only, loopback http: included (decision 13)", () => {
  const loopback = ["http://localhost:8787", "http://127.0.0.1:8787", "http://[::1]:8787"];

  it.each(loopback)("rejects a logo on %s", (origin) => {
    expect(pathOf(mutate((input) => (input.logo.url = `${origin}/logo.png`)))).toBe("logo.url");
  });

  it.each(loopback)("rejects a web font on %s", (origin) => {
    const font = { family: "Gloock", url: `${origin}/g.woff2`, weight: 400 };
    expect(pathOf(mutate((input) => (input.webFonts = [font])))).toBe("webFonts[0].url");
  });

  it.each(loopback)("rejects a footer link on %s", (origin) => {
    expect(pathOf(mutate((input) => (input.footer.link.url = `${origin}/privacy`)))).toBe(
      "footer.link.url",
    );
  });
});

describe("F1.6 shape of the two real themes (the built-in modules are tested by T4)", () => {
  it.each(raw.map((theme) => [theme.id, theme] as const))("%s passes", (_id, theme) => {
    expect(() => defineTheme(toInput(theme))).not.toThrow();
  });
});

describe("fixed strings (F2.5, F3)", () => {
  it("gives the fallback lead of F2.5 in each language", () => {
    expect(stringsFor("fr").fallbackLead).toBe(
      "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :",
    );
    expect(stringsFor("en").fallbackLead).toBe(
      "Button not working? Paste this address into your browser:",
    );
  });

  it("uses French spacing before the colon only in French", () => {
    expect(labelled("fr", "Me connecter", "https://app.example.com/v?t=1")).toBe(
      "Me connecter : https://app.example.com/v?t=1",
    );
    expect(labelled("en", "Sign in", "https://app.example.com/v?t=1")).toBe(
      "Sign in: https://app.example.com/v?t=1",
    );
    expect(labelled("fr", stringsFor("fr").codeLabel, "482 913")).toBe("Code : 482 913");
    expect(labelled("en", stringsFor("en").codeLabel, "482 913")).toBe("Code: 482 913");
  });
});
