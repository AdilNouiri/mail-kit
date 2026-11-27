import { defineTheme } from "../theme.ts";
import type { Theme, ThemeInput } from "../types.ts";

export const majordomeInput: ThemeInput = {
  id: "majordome",
  lang: "fr",
  wordmark: "majordome",
  logo: { url: "https://majordomeapp.fr/media/mail-logo.png", width: 48, height: 28 },
  colors: {
    brand: "#14332e",
    onBrand: "#eef1ec",
    accent: "#c8372d",
    onAccent: "#ffffff",
    canvas: "#eef1ec",
    card: "#ffffff",
    text: "#0f2420",
    textSoft: "#3c5a53",
    muted: "#56706a",
    subtle: "#eef1ec",
    link: "#c8372d",
    footerText: "#3c5a53",
  },
  dark: {
    canvas: "#0f2420",
    card: "#14332e",
    text: "#eef1ec",
    textSoft: "#c9d5d0",
    muted: "#a8beb7",
    subtle: "#1d4740",
    link: "#f0857a",
  },
  fonts: {
    display: "'Gloock', Georgia, 'Times New Roman', serif",
    displayWeight: 400,
    text: "'Figtree', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  webFonts: [
    { family: "Gloock", url: "https://majordomeapp.fr/fonts/Gloock-Regular.woff2", weight: 400 },
    { family: "Figtree", url: "https://majordomeapp.fr/fonts/Figtree-Regular.woff2", weight: 400 },
    { family: "Figtree", url: "https://majordomeapp.fr/fonts/Figtree-SemiBold.woff2", weight: 600 },
  ],
  buttonRadius: 999,
  footer: {
    reason:
      "Vous recevez cet e-mail parce qu'une connexion à Majordome a été demandée avec cette adresse.",
    legal: "Majordome · majordomeapp.fr",
    link: { label: "Confidentialité", url: "https://majordomeapp.fr/confidentialite/" },
  },
};

export const majordome: Theme = defineTheme(majordomeInput);
