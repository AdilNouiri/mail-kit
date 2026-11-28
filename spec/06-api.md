# 6. API

mail-kit has no HTTP API. Its interface is the package's exports and two npm scripts. The
signatures below are frozen in T0 (`src/types.ts`, `src/index.ts`).

## 6.1 Package exports

| Export | Signature | Errors |
| --- | --- | --- |
| `mail-kit` → `defineTheme` | `(input: ThemeInput) => Theme` | `ThemeError { path: string; message: string }` (F1) |
| `mail-kit` → `renderMail` | `(theme: Theme, content: MailContent) => RenderedMail` | `ContentError { blockIndex?: number; field: string; message: string }` (F2, F4.8: `field` `html` when the html passes 100,000 bytes); `ThemeError` with `path` `theme` for a theme `defineTheme` did not return (F1.8) |
| `mail-kit` → `renderText` | `(theme: Theme, content: MailContent) => string` | the same `ContentError` and `ThemeError` as `renderMail`, from the same content checks (F2.12); exported for tests |
| `mail-kit` → types | `Theme`, `ThemeInput`, `MailContent`, `Block`, `Inline`, `RenderedMail`, `ThemeError`, `ContentError`, `VERSION` | — |
| `mail-kit/themes/majordome` | `export const majordome: Theme` | — |
| `mail-kit/themes/dream-studio` | `export const dreamStudio: Theme` | — |
| `mail-kit/samples` | `export const samples: Record<"magic-link" \| "code" \| "notice", (lang) => MailContent>` | — |

`renderMail` is synchronous and pure: no I/O, no clock, no randomness (F2.8).

Majordome's use, for the hand-off:

```ts
import { renderMail } from "mail-kit";
import { majordome } from "mail-kit/themes/majordome";

const { subject, html, text } = renderMail(majordome, {
  subject: "Votre lien de connexion Majordome",
  preheader: "Valable 15 minutes, une seule fois.",
  blocks: [
    { type: "heading", text: "Votre lien de connexion" },
    { type: "paragraph", content: "Bonjour, touchez le bouton pour ouvrir votre espace Majordome." },
    { type: "button", label: "Me connecter", url },
    { type: "note", content: "Le lien est valable 15 minutes et ne sert qu'une fois. Vous n'avez rien demandé ? Ignorez cet e-mail, rien ne sera créé." },
  ],
});
```

## 6.2 Commands

| Command | Input | Output | Errors |
| --- | --- | --- | --- |
| `npm run preview` | — | `preview/` (F5) | exit 1 with the install command when no headless Chromium |
| `npm run send-test -- --theme <id> --sample <name> --to <address> [--lang fr\|en] [--allow-any]` (`--lang` defaults to `fr`) | `RESEND_API_KEY`, `MAIL_KIT_TEST_FROM` and `MAIL_KIT_TEST_MAILBOXES` (the allow-list: Claude-owned addresses, comma-separated, case-insensitive; empty refuses every `--to` unless `--allow-any`) in the environment | the Resend message id | exit 2 on an unknown option, a missing input, a malformed `RESEND_API_KEY` (the key is never printed), an unknown theme, sample or `--lang`, or a `--to` outside the allow-list without `--allow-any`, never printing the value given (F8.7); exit 1 on a non-2xx answer, with the status only (F8) |
