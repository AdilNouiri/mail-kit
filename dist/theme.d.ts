import { type Theme, type ThemeInput } from "./types.ts";
/**
 * F1.8: the `Theme` brand exists at the type level only, so a cast or a copy would reach
 * `bgcolor` and `style` unvalidated; only an object `defineTheme` returned renders.
 */
export declare function assertDefinedTheme(theme: unknown): void;
export declare function defineTheme(input: ThemeInput): Theme;
