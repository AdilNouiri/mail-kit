import type { Theme } from "../types.ts";
/** The one `<style>` block: web fonts, the phone width and dark mode. */
export declare function styleBlock(theme: Theme): string;
/**
 * Outlook's Word engine shows Times New Roman when the first family of a stack is a web
 * font it cannot load, so Outlook alone gets the stacks without the web fonts.
 */
export declare function msoStyle(theme: Theme): string;
