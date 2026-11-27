import type { Block, MailContent, Theme, ThemeInput } from "../../src/types.ts";

/** Casts the brand: T1's `defineTheme` is not merged yet, and these values are valid. */
export function testTheme(input: ThemeInput): Theme {
  return {
    wordmarkSpacing: 0,
    lang: "en",
    buttonRadius: 8,
    webFonts: [],
    ...input,
    fonts: { displayWeight: 700, ...input.fonts },
  } as unknown as Theme;
}

export const majordomeLike = testTheme({
  id: "majordome-test",
  lang: "fr",
  wordmark: "majordome",
  logo: { url: "https://majordome.example.com/logo@2x.png", width: 48, height: 28 },
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
    {
      family: "Gloock",
      url: "https://majordome.example.com/fonts/Gloock-Regular.woff2",
      weight: 400,
    },
    {
      family: "Figtree",
      url: "https://majordome.example.com/fonts/Figtree-Regular.woff2",
      weight: 400,
    },
    {
      family: "Figtree",
      url: "https://majordome.example.com/fonts/Figtree-SemiBold.woff2",
      weight: 600,
    },
  ],
  buttonRadius: 999,
  footer: {
    reason: "Vous recevez cet e-mail parce qu'une connexion a été demandée avec cette adresse.",
    legal: "Majordome · example.com",
    link: { label: "Confidentialité", url: "https://example.com/confidentialite/" },
  },
});

export const dreamStudioLike = testTheme({
  id: "dream-studio-test",
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
  fonts: {
    display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    text: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  buttonRadius: 10,
  footer: {
    reason: "You received this email because someone tried to sign in with this address.",
    legal: "Dream Studio · example.com",
  },
});

export const themes = { majordome: majordomeLike, "dream-studio": dreamStudioLike } as const;

export const TOKEN_URL = "https://app.example.com/auth/verify?token=EXAMPLE-TOKEN-1234";

export const magicLink: MailContent = {
  subject: "Votre lien de connexion",
  preheader: "Valable 15 minutes, une seule fois.",
  blocks: [
    { type: "heading", text: "Votre lien de connexion" },
    { type: "paragraph", content: "Bonjour, touchez le bouton pour ouvrir votre espace." },
    { type: "button", label: "Me connecter", url: TOKEN_URL },
    {
      type: "note",
      content:
        "Le lien est valable 15 minutes et ne sert qu'une fois. Vous n'avez rien demandé ? Ignorez cet e-mail.",
    },
  ],
};

export const code: MailContent = {
  subject: "Your sign-in code",
  preheader: "Your code expires in 10 minutes.",
  blocks: [
    { type: "heading", text: "Your sign-in code" },
    { type: "paragraph", content: "Enter this code on the sign-in page to continue." },
    { type: "code", code: "482913", group: 3 },
    {
      type: "note",
      content: "The code expires in 10 minutes. If you did not try to sign in, ignore this email.",
    },
  ],
};

export const notice: MailContent = {
  subject: "Your account was updated",
  blocks: [
    { type: "heading", text: "Your account was updated" },
    {
      type: "paragraph",
      content: [
        "Your ",
        { bold: "email address" },
        " changed. Review it in ",
        { text: "your settings", url: "https://app.example.com/settings" },
        ".",
      ],
    },
    { type: "divider" },
    { type: "link", lead: "Or open this address:", url: "https://app.example.com/settings" },
    { type: "note", content: "Not you? Write to support@example.com." },
  ],
};

export const blockSets = { "magic-link": magicLink, code, notice } as const;

/** One block of each type, in a fixed order. */
export const everyBlock: readonly Block[] = [
  { type: "heading", text: "Every block" },
  { type: "paragraph", content: "A paragraph." },
  { type: "button", label: "Open", url: "https://app.example.com/open", fallback: false },
  { type: "link", lead: "The address:", url: "https://app.example.com/link" },
  { type: "code", code: "ABC123" },
  { type: "note", content: "A note." },
  { type: "divider" },
];
