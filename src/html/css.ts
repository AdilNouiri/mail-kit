import type { Theme } from "../types.ts";

/**
 * Makes a free-text theme value (a font stack, a family, a font URL) safe inside a CSS
 * declaration, whether in a `style` attribute or the `<style>` block: it cannot end the
 * declaration, the rule, the attribute or the element.
 */
export function cssValue(value: string): string {
  return value.replace(/"/g, "'").replace(/[<>{};\\]/g, "");
}

function familyName(entry: string): string {
  return entry
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase();
}

/** The stack without the theme's web font families: what a client without web fonts uses. */
export function fallbackStack(theme: Theme, stack: string): string {
  const webFamilies = new Set(theme.webFonts.map((font) => familyName(font.family)));
  const kept = stack.split(",").filter((entry) => !webFamilies.has(familyName(entry)));
  return cssValue(kept.map((entry) => entry.trim()).join(", "));
}

export const MONO_STACK = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
