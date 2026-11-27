# 3. Features

## F1 — Theme model and validation

A consumer describes its brand once as a theme. `defineTheme(input)` checks it and returns
a frozen `Theme`; a wrong theme fails at start-up, never when a mail is sent. Fields:
[04-data-model.md](04-data-model.md). Milestone: M1.

Acceptance criteria:

1. **Valid theme accepted.** Given the input of the `majordome` built-in theme, when
   `defineTheme` runs, then it returns a deeply frozen object equal to the input with the
   defaults filled in (`buttonRadius` 8, `lang` `en`).
2. **Bad colour rejected.** Given a theme whose `colors.accent` is `red` or `#c83`, when
   `defineTheme` runs, then it throws a `ThemeError` whose `path` is `colors.accent`:
   colours are 6-digit hex `#rrggbb` only.
3. **Logo must be absolute HTTPS PNG or JPEG.** Given a `logo.url` that is relative, `http:`,
   or ends in `.svg`, when `defineTheme` runs, then it throws a `ThemeError` on
   `logo.url`.
4. **Contrast checked.** Given a theme where `colors.onAccent` on `colors.accent`, or
   `colors.text` on `colors.card`, has a WCAG contrast ratio under 4.5, when
   `defineTheme` runs, then it throws a `ThemeError` naming the pair and the ratio; the
   same check runs on the dark colours.
5. **Fonts end with a generic family.** Given a font stack that does not end with `serif`,
   `sans-serif` or `monospace`, when `defineTheme` runs, then it throws a `ThemeError` on
   that font.
6. **Every built-in theme passes.** Given each theme of `src/themes/`, when the tests run,
   then `defineTheme` accepts it.

Edge cases and errors:

- Unknown field → `ThemeError` (a typo must not be silently ignored).
- `logo` absent → the banner shows the wordmark alone.
- `webFonts` absent → only the fallback stacks are used; present → each URL must be
  absolute HTTPS and end in `.woff2`.

## F2 — HTML layout and blocks

`renderMail(theme, content)` builds the html: the layout of [05-screens.md](05-screens.md)
with the blocks in order. Every style is inline; one `<style>` block adds dark mode and the
phone width. Milestone: M1.

Acceptance criteria:

1. **Layout in order.** Given the `magic-link` sample mail and any built-in theme, when it
   renders, then the html holds, in this order: the hidden preheader, the banner (logo when
   set, then wordmark), the accent rule, the card with the blocks, the footer.
2. **Each block renders.** Given one content with each block type, when it renders, then
   each block appears once, in order, with the markup and inline styles of the mockups
   (`spec/images/src/build-mockups.mjs` is the visual reference).
3. **Text escaped.** Given a paragraph `<b>Alice & "Bob"</b>`, when it renders, then the
   html contains `&lt;b&gt;Alice &amp; &quot;Bob&quot;&lt;/b&gt;` and no `<b>` from it.
4. **URLs checked.** Given a button or link URL that is not `https:` or `mailto:` (nor a
   loopback `http:` URL, F2.9), when it renders, then `renderMail` throws a `ContentError`
   with the block index.
5. **Button with fallback link.** Given a button block, when it renders, then a bulletproof
   button (a table cell with `bgcolor` and an `<a>` with padding) and, for Outlook, a VML
   `v:roundrect` inside `<!--[if mso]>` are output; unless `fallback: false`, a fallback
   link follows with the theme language's lead text (fr: « Le bouton ne marche pas ?
   Copiez cette adresse dans votre navigateur : », en: "Button not working? Paste this
   address into your browser:").
6. **Code block readable.** Given a code block `482913` with `group: 3`, when it renders,
   then the code shows as `482 913` in a monospace stack, and the cell's `aria-label` is
   `482913`, so a screen reader reads one code.
7. **Pixel match with the mockups.** Given the two mockup mails rendered by mail-kit and by
   `build-mockups.mjs`, when both are screenshotted at 1280 × 800 and 390 × 844 in light
   and dark, then the images differ by under 1 % of pixels.
8. **Same input, same bytes.** Given the same theme and content, when it renders twice,
   then the html strings are identical (no date, no random id).
9. **Loopback `http:` accepted for local development.** Given a button, link block or
   inline link whose URL is `http:` with the host `localhost`, `127.0.0.1` or `[::1]`
   (any port, path, query and fragment), when it renders, then it renders like an `https:`
   URL, in the html (the button's `href`, its fallback link) and in the text part. The
   host must be one of the three both as written (ignoring case) and as the WHATWG URL
   parser returns it, so an uppercase host (`http://LOCALHOST:8787/v`) is accepted (the
   same host), while spellings the parser rewrites to a loopback host
   (`http://127.1/`, `http://0x7f.0.0.1/`, `http://[0:0:0:0:0:0:0:1]/`) are refused: no
   request origin is written that way, and a host checked as written is easier to audit.
   Every other `http:` URL still throws a `ContentError` with the block index, among them
   the lookalikes `http://localhost.example.com/`, `http://127.0.0.1.example.com/` and
   `http://localhost./`, other addresses such as `http://127.0.0.2/` and `http://[::2]/`,
   and every `http:` URL that holds userinfo: `http://localhost@evil.example/` (its host
   is `evil.example`) and `http://evil.example@localhost/` (its host is loopback, but the
   text before `@` misleads a reader). No other scheme changes, and theme URLs (`logo`,
   `webFonts`, `footer.link`) stay `https:` only (decision 13). Found by Majordome, whose
   magic link is built from the request origin, `http://localhost:<port>` under
   `wrangler dev` and its Playwright e2e harness.

Edge cases and errors:

- Empty `blocks` → `ContentError` (a mail with no body is a bug).
- `subject` empty or over 200 characters → `ContentError`.
- `preheader` absent → no hidden preheader div.
- A paragraph `Inline` link uses the theme's `colors.link`, underlined.
- A button's address appears twice in the html, in the button's `href` and in the visible
  fallback link of F2.5: this is the designed fallback, not a defect; `fallback: false`
  drops the second one.

## F3 — Plain-text part

The text part is built from the same content, so the two parts never disagree.
Milestone: M1.

Acceptance criteria:

1. **Same words.** Given any sample mail, when it renders, then every word of every block,
   and the footer, appears in the text part in the same order.
2. **Button as label and address.** Given a button `Me connecter` to `https://app.example.com/v?t=1`,
   when it renders, then the text part has the line `Me connecter : https://app.example.com/v?t=1`
   for `fr` (French spacing) and `Sign in: https://…` for `en`, and no fallback-link line is
   repeated.
3. **URLs never broken.** Given a URL of 300 characters, when it renders, then it stays on
   one line of the text part; other lines wrap at 76 characters on spaces.
4. **No markup.** Given any content, when it renders, then the text part contains no `<`
   tag and no HTML entity.
5. **Headings set apart.** Given a heading, when it renders, then it is followed by a line
   of `=` of the same length, and blocks are separated by one empty line.

Edge cases and errors:

- A code block renders as `Code : 482 913` (fr) or `Code: 482 913` (en).
- A divider renders as `---`.
- The footer follows a line `--`.

## F4 — Client compatibility rules

The html follows the rules that make it render in Gmail, Apple Mail and Outlook; a lint test
enforces them so no change breaks a client silently. Milestone: M1.

Acceptance criteria:

1. **Forbidden constructs absent.** Given every theme × sample mail, when the lint test
   runs, then the html has no `<script>`, `<link>`, `<svg>`, `<img src="…svg">`, `display:flex`,
   `display:grid`, `position:`, CSS variable `var(`, `<form>`, external `url(` other than
   the theme's `webFonts`, and no `class` used without an inline style that holds the
   light look.
2. **Outlook frame.** Given any rendered mail, when it is read, then it has the
   `xmlns:v` and `xmlns:o` namespaces, the `OfficeDocumentSettings` 96 PPI block, a fixed
   600 px table inside `<!--[if mso]>`, and an `mso` style that replaces web fonts with
   the fallback stack.
3. **Dark mode.** Given any theme, when the html renders under
   `prefers-color-scheme: dark`, then canvas, card, text, muted text and subtle fills take
   the theme's dark colours; the `color-scheme` and `supported-color-schemes` metas say
   `light dark`; and Outlook.com's `[data-ogsc]` selectors repeat the text colours.
4. **Phone width.** Given a 390 px viewport, when the mail renders, then no element is wider
   than the viewport (`scrollWidth` equals 390), side padding is 24 px and the card has
   square corners.
5. **Size under Gmail's clip.** Given every theme × sample mail, when it renders, then the
   html is under 60 KB (Gmail clips at 102 KB).
6. **Accessible.** Given any rendered mail, then `<html>` has the theme's `lang`, every
   layout table has `role="presentation"`, the logo `<img>` has `alt=""` (the wordmark
   beside it is text), the heading is an `<h1>`, and every text colour pair meets 4.5:1.
7. **Long code fits a phone.** Given a code block of 12 characters with `group: 1` (23
   displayed characters, the longest allowed), when it renders at 390 px in headless
   Chromium, then the code stays on one line inside the card and `scrollWidth` equals
   390; a code of at most 12 displayed characters (the `482 913` sample) keeps 30 px with
   8 px letter spacing, so the mockups do not change.

Edge cases and errors:

- A client that drops the `<style>` block (Gmail on some Android accounts) still shows the
  correct light layout at 600 px, scaled by the client.

## F5 — Preview gallery

`npm run preview` writes the preview gallery, so the owner and Claude see every theme
without sending a mail. Milestone: M1.

Acceptance criteria:

1. **Every theme × sample.** Given the built-in themes and sample mails, when
   `npm run preview` runs, then `preview/` holds one `.html` and one `.txt` per pair, and
   `preview/index.html` links them all.
2. **PNGs in four views.** Given the same run, then `preview/png/` holds, per pair, a PNG at
   1280 × 800 and at 390 × 844, each in light and dark (headless Chromium, never Google
   Chrome).
3. **Runs offline.** Given no network, when `npm run preview` runs, then it succeeds; logos
   and web fonts come from `assets/` through a local override of their URLs.

Edge cases and errors:

- No headless Chromium found → html and txt are written, the PNG step exits non-zero with
  the install command.

## F6 — Versioned package for Workers and Node

Consumers install a tag from GitHub and import compiled ES modules with types.
Milestone: M1.

Acceptance criteria:

1. **Built output committed at each tag.** Given a tag `v0.1.0`, when a consumer runs
   `npm install github:<owner>/mail-kit#v0.1.0`, then `node_modules/mail-kit/dist/` holds
   `.js` and `.d.ts` files, with no install script run.
2. **Works in a Worker.** Given the fixture `test/consumers/worker/`, when its test runs in
   `workerd` (`@cloudflare/vitest-plugin`), then importing `mail-kit` and
   `mail-kit/themes/majordome` and calling `renderMail` returns the expected subject and a
   non-empty html.
3. **Works in Node.** Given the fixture `test/consumers/node/`, when `node --test` runs it
   on Node 22, then the same call succeeds.
4. **No runtime dependency.** Given `package.json`, then `dependencies` is empty and
   `dist/` imports nothing outside itself.
5. **Version stamp.** Given any rendered mail, then the html holds one comment
   `<!-- mail-kit <version> -->`, so a received mail tells which version built it.

Edge cases and errors:

- A consumer on a tag whose major is older keeps working: breaking changes bump the major
  and list the migration in `CHANGELOG.md`.

## F7 — Built-in themes

mail-kit ships the themes of its first consumers, approved by the owner from the mockups.
Milestone: M1.

Acceptance criteria:

1. **Majordome theme.** Given `mail-kit/themes/majordome`, then its wordmark, colours,
   dark colours, fonts, button radius and footer equal the `majordome` entry of
   `spec/images/src/themes.json` (colours of Majordome's
   `public/site.css`: livery `#14332e`, linen `#eef1ec`, lacquer `#c8372d`, ink
   `#0f2420`), with `logo.url` `https://majordomeapp.fr/media/mail-logo.png`,
   `lang` `fr` and the web fonts Gloock and Figtree from `https://majordomeapp.fr/fonts/`.
2. **Dream Studio theme.** Given `mail-kit/themes/dream-studio`, then the same fields
   equal the `dream-studio` entry of `themes.json` (black `#0a0a0a` from Dream Studio's
   `mail-service/src/templates/shared/styles.ts`, its pink `#e91e8c` darkened to `#db1a83`
   for the button contrast, decision 7), with no logo.
3. **Logo files ready to host.** Given `assets/majordome/`, then it holds `mail-logo.png`
   at 96 × 56 (2× of its 48 × 28 display size), rendered from Majordome's frozen
   `logo.svg`, with its SHA-256 in `assets/README.md`.

Edge cases and errors:

- A consumer may pass its own theme object instead of a built-in one; it goes through
  `defineTheme` the same way.

## F8 — Test sends to real clients

`npm run send-test` sends rendered mails through Resend to a mailbox Claude reads, and each
release is checked against the clients that matter. No client check needs a mailbox the
owner makes (decision 14): each criterion says whether it runs a **real renderer** (the
client's own rendering code) or is **emulated** (the client's documented sanitizing
applied to the rendered html, shown in the headless test Chrome). An emulated criterion
is reported as emulated, never as passed in the real client. Milestone: M2.

Acceptance criteria:

1. **One command per pair.** Given `RESEND_API_KEY` in the environment (through
   `vault run`), when `npm run send-test -- --theme majordome --sample magic-link --to <address>`
   runs, then Resend answers 2xx and the command prints the message id, never the key.
2. **Refuses without a key or an address.** Given no key or no `--to`, when it runs, then it
   exits 2 with the missing name and sends nothing.
3. **Gmail web emulated.** Emulated, never marked passed in real Gmail. Given every
   built-in theme × sample rendered by `renderMail`, when a script of `test/clients/`
   applies Gmail's documented sanitizing (variant A, Gmail web: the `prefers-color-scheme`
   rules and the CSS properties Gmail drops removed; variant B, Gmail with a non-Gmail
   account: the whole `<style>` block removed; each rule cited in `decisions/T12.md`) and
   screenshots the result in the headless test Chrome, then the banner, the button and the
   footer show as in the preview, light: variant A at 1280 and 390 wide, variant B at 1280
   wide with nothing wider than the 600 px card.
4. **Apple Mail renderer checked.** Real renderer, without the Mail app window. Given the
   same mails written as `.eml` files (multipart html and text), when each is opened with
   Apple Mail's Quick Look extension (`com.apple.mail.MailQuickLookExtension`, no account
   needed) inside the test sandbox (`sandbox run`), with the guest in light then dark
   appearance, then the screenshots match the preview in light and dark; if the extension
   does not render dark, the light screenshots stand and the gap is recorded.
5. **Outlook.com web emulated.** Emulated, never marked passed in real Outlook. Given the
   same mails, when a script of `test/clients/` applies Outlook.com's documented rewriting
   (each `class` and selector prefixed `x_`, the `prefers-color-scheme` rules removed;
   each rule cited in `decisions/T12.md`) and screenshots the result at 1280 wide, then
   the banner and a button with its colour show; classic Outlook stays unchecked (open
   question 2), covered only by the MSO rules of F4.2.
6. **Release checklist.** Given a new tag, then `CHANGELOG.md` records which clients were
   checked for it, each marked "real renderer" or "emulated", and links the screenshots in
   the verification report.

Edge cases and errors:

- Resend 429 (quota) → the command waits the `retry-after` once, then stops with the
  status.
- A send to an address outside Claude's own mailboxes is refused unless `--allow-any` is
  given (test sends never reach a real person).
- The emulations of F8.3 and F8.5 cannot show a client's own behaviour beyond its
  documented rules (Gmail's image proxy, forced dark mode in the Gmail and Outlook apps):
  those gaps are listed in the verification report, never closed by asking the owner for
  a mailbox (decision 14).
