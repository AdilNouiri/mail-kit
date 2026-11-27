import { defineTheme } from "../theme.ts";
import type { Theme, ThemeInput } from "../types.ts";

const system =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const dreamStudioInput: ThemeInput = {
  id: "dream-studio",
  lang: "en",
  wordmark: "DREAM STUDIO",
  wordmarkSpacing: 3,
  colors: {
    brand: "#0a0a0a",
    onBrand: "#ffffff",
    accent: "#db1a83",
    onAccent: "#ffffff",
    canvas: "#f4f4f5",
    card: "#ffffff",
    text: "#111111",
    textSoft: "#3f3f46",
    muted: "#5f5f68",
    subtle: "#fdf2f8",
    link: "#c2185b",
    footerText: "#52525b",
  },
  dark: {
    canvas: "#0a0a0a",
    card: "#18181b",
    text: "#ffffff",
    textSoft: "#d4d4d8",
    muted: "#a1a1aa",
    subtle: "#27272a",
    link: "#f472b6",
  },
  fonts: { display: system, displayWeight: 700, text: system },
  buttonRadius: 10,
  footer: {
    reason:
      "You received this email because someone tried to sign in to Dream Studio with this address.",
    legal: "Dream Studio · example.com",
  },
};

export const dreamStudio: Theme = defineTheme(dreamStudioInput);
