# mail-kit

One transactional email design for all the owner's tools, themed per tool. A tool passes
its theme (logo or wordmark, colours, fonts, footer) and a list of blocks; mail-kit hands
back a finished `subject`, `html` and `text`, ready for any sender (Resend, SMTP). It runs
in Cloudflare Workers and Node 22 or later, with no runtime dependency.

## Install

Each release is a Git tag with the compiled `dist/` committed, so npm installs it from
GitHub with no build step and no install script:

```sh
npm install github:AdilNouiri/mail-kit#v0.1.1
```

The package ships ES modules with types. Its exports:

| Import | What |
| --- | --- |
| `mail-kit` | `renderMail`, `defineTheme`, `renderText`, the types, `VERSION` |
| `mail-kit/themes/majordome`, `mail-kit/themes/dream-studio` | the built-in themes |
| `mail-kit/samples` | sample mails (`magic-link`, `code`, `notice`) in `fr` and `en` |

## Example: Majordome's magic link

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

`renderMail` is synchronous and pure. Every text is escaped; only `https:` and `mailto:`
URLs are accepted, plus loopback `http:` in content blocks. Pass `subject`, `html` and `text` to your sender. Every mail carries a
`<!-- mail-kit <version> -->` comment that tells which version built it.

## Themes

`majordome` and `dream-studio` are built in. For another tool, build a theme with
`defineTheme(input)`: it validates the colours (WCAG contrast, light and dark), fonts, logo
and footer, and throws a `ThemeError` that names the faulty path. The result is frozen.

## Preview

```sh
npm run preview
```

Writes `preview/` (ignored by Git): one `.html` and one `.txt` per theme and sample, PNGs
at 1280 x 800 and 390 x 844 in light and dark, and an `index.html` that links them. It runs
offline in a headless Chromium (`$CCS_TEST_CHROME`, else Playwright's
`chromium-headless-shell`), never Google Chrome. Without one it exits 1 and prints the
install command.

## Send a test mail

```sh
npm run send-test -- --theme <id> --sample <name> --to <address> [--lang fr|en] [--allow-any]
```

Sends one rendered sample through Resend. It needs `RESEND_API_KEY`, `MAIL_KIT_TEST_FROM` and
`MAIL_KIT_TEST_MAILBOXES` (the allow-list of recipient addresses) in the environment.

## Client recipes

`node test/clients/run.ts` renders every theme and sample through emulated recipes (all
emulated, none a real client): Gmail web (two variants), Outlook.com, and WebKit for Apple
Mail, with screenshots, and rewrites the Apple Mail `.eml` files of
`test/clients/apple-mail/eml/`. `node test/clients/run.ts --verify` only checks that those
files match what `renderMail` produces; the check runs it last.

## Check

```sh
npm install
heavy npm run check
```

Runs Biome, `tsc --noEmit`, the unit tests, the Worker consumer fixture (workerd, through
`@cloudflare/vitest-plugin`), the Node consumer fixture (`node --test`), the preview, the
mockup comparison and the `.eml` freshness check. Both fixtures install the packed tarball of a dry-run release, so they
test what a consumer receives.

## Release

```sh
node scripts/release.ts --dry-run   # builds and tags in a temporary clone, pushes nothing
node scripts/release.ts             # on main, clean tree, equal to origin/main: pushes the tag only
```

The script builds `dist/` with `tsc` in a temporary clone, makes one commit that adds
`dist/` on a detached HEAD (a child of `main`, on no branch), tags `v<version>` on it and
pushes only that tag. `main` never holds `dist/` and is never pushed. Bump `version` in `package.json` and `VERSION` in `src/types.ts` together first, and
add the entry to `CHANGELOG.md`.

The specification is in [`spec/`](spec/README.md).
