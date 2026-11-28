import type { Theme } from "../types.ts";
/**
 * Makes a free-text theme value (a font stack, a family, a font URL) safe inside a CSS
 * declaration, whether in a `style` attribute or the `<style>` block: it cannot end the
 * declaration, the rule, the attribute or the element. `&` goes too: inside a `style`
 * attribute the html parser decodes an entity such as `&#59` to `;` before CSS reads it (F1.7).
 */
export declare function cssValue(value: string): string;
/**
 * The stack without the theme's web font families: what a client without web fonts uses.
 * Never empty: a stack of web fonts only keeps its last entry, the generic family.
 */
export declare function fallbackStack(theme: Theme, stack: string): string;
export declare const MONO_STACK = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
