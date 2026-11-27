import type { Lang, MailContent, Samples } from "./types.ts";

const url = "https://app.example.com/auth/verify?token=EXAMPLE-TOKEN-1234";

const magicLink: Record<Lang, MailContent> = {
  fr: {
    subject: "Votre lien de connexion Majordome",
    preheader: "Valable 15 minutes, une seule fois.",
    blocks: [
      { type: "heading", text: "Votre lien de connexion" },
      {
        type: "paragraph",
        content: "Bonjour, touchez le bouton pour ouvrir votre espace Majordome.",
      },
      { type: "button", label: "Me connecter", url },
      {
        type: "link",
        lead: "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :",
        url,
      },
      {
        type: "note",
        content:
          "Le lien est valable 15 minutes et ne sert qu'une fois. Vous n'avez rien demandé ? Ignorez cet e-mail, rien ne sera créé.",
      },
    ],
  },
  en: {
    subject: "Your sign-in link",
    preheader: "Valid for 15 minutes, one use only.",
    blocks: [
      { type: "heading", text: "Your sign-in link" },
      { type: "paragraph", content: "Hello, tap the button to open your space." },
      { type: "button", label: "Sign in", url },
      { type: "link", lead: "The button does not work? Copy this address into your browser:", url },
      {
        type: "note",
        content:
          "The link is valid for 15 minutes and works once. Did not ask for it? Ignore this email, nothing will be created.",
      },
    ],
  },
};

const code: Record<Lang, MailContent> = {
  fr: {
    subject: "Votre code de connexion",
    preheader: "Votre code expire dans 10 minutes.",
    blocks: [
      { type: "heading", text: "Votre code de connexion" },
      { type: "paragraph", content: "Saisissez ce code sur la page de connexion pour continuer." },
      { type: "code", code: "482913", group: 3 },
      {
        type: "note",
        content:
          "Le code expire dans 10 minutes. Si vous n'avez pas tenté de vous connecter, ignorez cet e-mail.",
      },
    ],
  },
  en: {
    subject: "Your sign-in code",
    preheader: "Your code expires in 10 minutes.",
    blocks: [
      { type: "heading", text: "Your sign-in code" },
      { type: "paragraph", content: "Enter this code on the sign-in page to continue." },
      { type: "code", code: "482913", group: 3 },
      {
        type: "note",
        content:
          "The code expires in 10 minutes. If you did not try to sign in, ignore this email.",
      },
    ],
  },
};

const notice: Record<Lang, MailContent> = {
  fr: {
    subject: "Votre mot de passe a été modifié",
    preheader: "Un changement a été fait sur votre compte.",
    blocks: [
      { type: "heading", text: "Mot de passe modifié" },
      { type: "paragraph", content: "Le mot de passe de votre compte vient d'être modifié." },
      { type: "divider" },
      { type: "note", content: "Ce n'était pas vous ? Répondez à cet e-mail pour nous le dire." },
    ],
  },
  en: {
    subject: "Your password was changed",
    preheader: "A change was made to your account.",
    blocks: [
      { type: "heading", text: "Password changed" },
      { type: "paragraph", content: "The password of your account was just changed." },
      { type: "divider" },
      { type: "note", content: "Was this not you? Reply to this email to tell us." },
    ],
  },
};

export const samples: Samples = Object.freeze({
  "magic-link": (lang) => magicLink[lang],
  code: (lang) => code[lang],
  notice: (lang) => notice[lang],
});
