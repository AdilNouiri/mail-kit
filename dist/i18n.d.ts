import type { Lang } from "./types.ts";
export interface Strings {
    /** Lead of the fallback link under a button (F2.5). */
    readonly fallbackLead: string;
    /** Label of a code block in the text part (F3). */
    readonly codeLabel: string;
    /** Separator between a label and what follows: French puts a space before the colon. */
    readonly colon: string;
}
export declare function stringsFor(lang: Lang): Strings;
/** `label : value` in French, `label: value` in English. */
export declare function labelled(lang: Lang, label: string, value: string): string;
