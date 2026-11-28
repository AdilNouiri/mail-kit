import type { RichText, Theme } from "../types.ts";
/** `linkColor` replaces the theme link colour (a note keeps its own text colour, F4.9). */
export declare function renderRichText(theme: Theme, content: RichText, linkColor?: string): string;
