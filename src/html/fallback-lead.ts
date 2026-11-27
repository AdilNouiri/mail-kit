import type { Lang } from "../types.ts";

// Stub until T1's src/i18n.ts is merged: the fallback lead then comes from there (F2.5).
export const FALLBACK_LEAD: Readonly<Record<Lang, string>> = {
  fr: "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :",
  en: "Button not working? Paste this address into your browser:",
};
