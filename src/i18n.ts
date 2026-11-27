import type { Lang } from "./types.ts";

export interface Strings {
  /** Lead of the fallback link under a button (F2.5). */
  readonly fallbackLead: string;
  /** Label of a code block in the text part (F3). */
  readonly codeLabel: string;
  /** Separator between a label and what follows: French puts a space before the colon. */
  readonly colon: string;
}

const strings: Readonly<Record<Lang, Strings>> = {
  fr: {
    fallbackLead: "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :",
    codeLabel: "Code",
    colon: " :",
  },
  en: {
    fallbackLead: "Button not working? Paste this address into your browser:",
    codeLabel: "Code",
    colon: ":",
  },
};

export function stringsFor(lang: Lang): Strings {
  return strings[lang];
}

/** `label : value` in French, `label: value` in English. */
export function labelled(lang: Lang, label: string, value: string): string {
  return `${label}${strings[lang].colon} ${value}`;
}
