import { contrastRatio, MIN_CONTRAST } from "./contrast.ts";
import { isAllowedUrl } from "./escape.ts";
import { type Theme, ThemeError, type ThemeInput } from "./types.ts";

type Obj = Record<string, unknown>;

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9-]{2,40}$/;
const GENERIC_FAMILIES = ["serif", "sans-serif", "monospace"];
const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

function isObject(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function join(parent: string, key: string): string {
  return parent === "" ? key : `${parent}.${key}`;
}

function fail(path: string, message: string): never {
  throw new ThemeError(path, message);
}

function objectAt(value: unknown, path: string, allowed: readonly string[]): Obj {
  if (!isObject(value)) return fail(path, "must be an object");
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(join(path, key), `unknown field "${key}"`);
  }
  return value;
}

function stringAt(value: unknown, path: string, min: number, max: number): string {
  if (typeof value !== "string") return fail(path, "must be a string");
  if (value.length < min || value.length > max) {
    return fail(path, `must be ${min} to ${max} characters`);
  }
  return value;
}

function numberAt(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    return fail(path, `must be a number from ${min} to ${max}`);
  }
  return value;
}

function hexAt(value: unknown, path: string): string {
  if (typeof value !== "string" || !HEX.test(value)) {
    return fail(path, "must be a 6-digit hex colour such as #c8372d");
  }
  return value;
}

function httpsUrlAt(value: unknown, path: string, extensions?: readonly string[]): string {
  if (typeof value !== "string" || !isAllowedUrl(value, ["https:"])) {
    return fail(path, "must be an absolute https: URL");
  }
  if (extensions) {
    const pathname = new URL(value).pathname.toLowerCase();
    if (!extensions.some((extension) => pathname.endsWith(extension))) {
      return fail(path, `must end in ${extensions.join(", ")}`);
    }
  }
  return value;
}

/**
 * F1.7: `cssValue` strips `; { } < > \` and `&`; refusing them here, with the control
 * characters (a newline ends the `@font-face` string), tells the developer instead.
 */
function cssTextAt(value: unknown, path: string, min: number, max: number): string {
  const text = stringAt(value, path, min, max);
  const hasControl = [...text].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (hasControl || /[&;{}<>\\]/.test(text)) {
    return fail(path, "must not hold &, a control character, ;, {, }, <, > or \\");
  }
  return text;
}

function fontAt(value: unknown, path: string): string {
  const stack = cssTextAt(value, path, 1, 500);
  const last = stack.split(",").pop()?.trim().toLowerCase() ?? "";
  if (!GENERIC_FAMILIES.includes(last)) {
    return fail(path, "must end with a generic family: serif, sans-serif or monospace");
  }
  return stack;
}

function checkContrast(
  foreground: string,
  background: string,
  foregroundPath: string,
  backgroundPath: string,
): void {
  const ratio = contrastRatio(foreground, background);
  if (ratio < MIN_CONTRAST) {
    fail(
      foregroundPath,
      `${foregroundPath} on ${backgroundPath} has a contrast ratio of ${ratio.toFixed(2)}, under ${MIN_CONTRAST}`,
    );
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const COLOR_KEYS = [
  "brand",
  "onBrand",
  "accent",
  "onAccent",
  "canvas",
  "card",
  "text",
  "textSoft",
  "muted",
  "subtle",
  "link",
  "footerText",
] as const;
const DARK_KEYS = ["canvas", "card", "text", "textSoft", "muted", "subtle", "link"] as const;

function readColors<K extends string>(
  value: unknown,
  path: string,
  keys: readonly K[],
): Record<K, string> {
  const source = objectAt(value, path, keys);
  const result = {} as Record<K, string>;
  for (const key of keys) result[key] = hexAt(source[key], join(path, key));
  return result;
}

const definedThemes = new WeakSet<object>();

/**
 * F1.8: the `Theme` brand exists at the type level only, so a cast or a copy would reach
 * `bgcolor` and `style` unvalidated; only an object `defineTheme` returned renders.
 */
export function assertDefinedTheme(theme: unknown): void {
  if (typeof theme !== "object" || theme === null || !definedThemes.has(theme)) {
    fail("theme", "must be a theme returned by defineTheme");
  }
}

export function defineTheme(input: ThemeInput): Theme {
  const source = objectAt(input, "", [
    "id",
    "wordmark",
    "wordmarkSpacing",
    "logo",
    "lang",
    "colors",
    "dark",
    "fonts",
    "webFonts",
    "buttonRadius",
    "footer",
  ]);

  const id = source.id;
  if (typeof id !== "string" || !ID.test(id)) {
    fail("id", "must be 2 to 40 characters of a-z, 0-9 and -");
  }
  const wordmark = stringAt(source.wordmark, "wordmark", 1, 40);
  const wordmarkSpacing =
    source.wordmarkSpacing === undefined
      ? 0
      : numberAt(source.wordmarkSpacing, "wordmarkSpacing", 0, 6);

  let logo: { url: string; width: number; height: number } | undefined;
  if (source.logo !== undefined) {
    const raw = objectAt(source.logo, "logo", ["url", "width", "height"]);
    logo = {
      url: httpsUrlAt(raw.url, "logo.url", [".png", ".jpg", ".jpeg"]),
      width: numberAt(raw.width, "logo.width", 16, 200),
      height: numberAt(raw.height, "logo.height", 16, 80),
    };
  }

  const lang = source.lang === undefined ? "en" : source.lang;
  if (lang !== "fr" && lang !== "en") fail("lang", 'must be "fr" or "en"');

  const colors = readColors(source.colors, "colors", COLOR_KEYS);
  const dark = readColors(source.dark, "dark", DARK_KEYS);

  const rawFonts = objectAt(source.fonts, "fonts", ["display", "displayWeight", "text"]);
  const displayWeight = rawFonts.displayWeight === undefined ? 700 : rawFonts.displayWeight;
  if (displayWeight !== 400 && displayWeight !== 600 && displayWeight !== 700) {
    fail("fonts.displayWeight", "must be 400, 600 or 700");
  }
  const fonts = {
    display: fontAt(rawFonts.display, "fonts.display"),
    displayWeight,
    text: fontAt(rawFonts.text, "fonts.text"),
  };

  let webFonts: { family: string; url: string; weight: number }[] = [];
  if (source.webFonts !== undefined) {
    if (!Array.isArray(source.webFonts)) fail("webFonts", "must be an array");
    if (source.webFonts.length > 4) fail("webFonts", "must hold at most 4 fonts");
    webFonts = source.webFonts.map((entry: unknown, index: number) => {
      const path = `webFonts[${index}]`;
      const raw = objectAt(entry, path, ["family", "url", "weight"]);
      const weight = raw.weight;
      if (typeof weight !== "number" || !FONT_WEIGHTS.includes(weight)) {
        fail(`${path}.weight`, "must be 100, 200, ... or 900");
      }
      return {
        family: cssTextAt(raw.family, `${path}.family`, 1, 100),
        url: httpsUrlAt(raw.url, `${path}.url`, [".woff2"]),
        weight: weight as number,
      };
    });
  }

  const buttonRadius =
    source.buttonRadius === undefined ? 8 : numberAt(source.buttonRadius, "buttonRadius", 0, 999);

  const rawFooter = objectAt(source.footer, "footer", ["reason", "legal", "link"]);
  const footer: { reason: string; legal: string; link?: { label: string; url: string } } = {
    reason: stringAt(rawFooter.reason, "footer.reason", 1, 300),
    legal: stringAt(rawFooter.legal, "footer.legal", 1, 200),
  };
  if (rawFooter.link !== undefined) {
    const raw = objectAt(rawFooter.link, "footer.link", ["label", "url"]);
    footer.link = {
      label: stringAt(raw.label, "footer.link.label", 1, 100),
      url: httpsUrlAt(raw.url, "footer.link.url"),
    };
  }

  checkContrast(colors.onBrand, colors.brand, "colors.onBrand", "colors.brand");
  checkContrast(colors.onAccent, colors.accent, "colors.onAccent", "colors.accent");
  checkContrast(colors.footerText, colors.canvas, "colors.footerText", "colors.canvas");
  const schemes = [
    { set: colors, prefix: "colors" },
    { set: dark, prefix: "dark" },
  ] as const;
  for (const { set, prefix } of schemes) {
    for (const key of ["text", "textSoft", "muted", "link"] as const) {
      checkContrast(set[key], set.card, `${prefix}.${key}`, `${prefix}.card`);
    }
    for (const key of ["text", "textSoft"] as const) {
      checkContrast(set[key], set.subtle, `${prefix}.${key}`, `${prefix}.subtle`);
    }
  }
  checkContrast(dark.muted, dark.canvas, "dark.muted", "dark.canvas");

  const theme = {
    id,
    wordmark,
    wordmarkSpacing,
    ...(logo ? { logo } : {}),
    lang,
    colors,
    dark,
    fonts,
    webFonts,
    buttonRadius,
    footer,
  };
  definedThemes.add(deepFreeze(theme));
  return theme as unknown as Theme;
}
