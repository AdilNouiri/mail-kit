# Changelog

Every tag `v<major>.<minor>.<patch>` is listed here. A breaking change bumps the major and
gives the migration; each release records which mail clients were checked (F8.6).

## 0.1.2

Input hardening, plain fixes and release checks. The stricter checks below can break only a
caller that relied on what they now refuse: a cast theme, an empty `footerReason`, a URL
with userinfo.

- Stricter, possibly breaking (F1.7, F1.8, F2.10 to F2.12, decision 15):
  - `renderMail` and `renderText` throw a `ThemeError` (path `theme`) for a theme that
    `defineTheme` did not return (a cast or a copy).
  - `defineTheme` refuses a font stack or `webFonts[].family` holding `&` or a control
    character, and `cssValue` also strips `&` (a `webFonts[].url` query loses its `&`). A
    hole in `webFonts` is a `ThemeError`. An empty `footerReason` is refused (1 to 300
    characters).
  - URLs holding userinfo (`https://user@host/`, `https://@host/`), zero-width characters
    or Bidi control characters are refused with a `ContentError`; `@` in a path or in
    `mailto:` stays accepted.
  - Content from untyped code throws only a `ContentError`: a non-object content, an
    unknown block type, and a paragraph or note that draws nothing (blank or only
    invisible characters) are refused.
  - `renderMail` refuses html over 100,000 UTF-8 bytes with a `ContentError` giving the
    size, so no mail reaches Gmail's 102 KB clip (F4.8). The text part is not counted.
- Fixes: a link in a note takes the note's own text colour, in light and dark, meeting 4.5:1
  on the note's fill; in the text part a wrapped heading is underlined to the length of its
  longest line, counted in grapheme clusters (an emoji counts one).
- Release: `scripts/release.ts` checks that CHANGELOG has the version's section and uses the
  releaser's identity without running `git config`.
- `npm run send-test` sends one theme and sample through Resend to Claude's mailboxes.
- Mail clients checked, over the 6 built-in theme and sample pairs, without any mailbox
  (decision 14); screenshots are in the CCS verification report of F8
  (CCS report dc86cfbf-6dbf-4522-999f-0d8f80c29202):
  - Gmail web, Google account (variant A): emulated, never marked passed in real Gmail.
  - Gmail web, non-Google account (variant B, no `<style>` block): emulated.
  - Outlook.com web: emulated, never marked passed in real Outlook.
  - Apple Mail: emulated with WebKit (light and dark). Quick Look's Mail extension opened no
    window for the `.eml` files in the sandbox guest, so it is not a real renderer check.
  - Classic Outlook: not checked, covered only by the MSO rules of F4.2.
  - Rules and sources: `spec/decisions/T12.md`; recipes: `test/clients/`.
- The 6 pairs were also sent through Resend to Claude's mailbox (`spec/decisions/T7.md`).

## 0.1.1

Content links accept loopback `http:` for local development (F2.9, decision 13).

- Button, link block and inline link URLs accept `http:` on the host `localhost`,
  `127.0.0.1` or `[::1]` (any port, path, query and fragment), rendered like an `https:`
  URL in the html and the text part. Found by Majordome, whose magic link under
  `wrangler dev` and its e2e harness is `http://localhost:<port>`.
- Still refused with a `ContentError`: lookalikes (`localhost.example.com`,
  `127.0.0.1.example.com`, `localhost.`), other addresses (`127.0.0.2`, `[::2]`),
  shorthand spellings the URL parser rewrites to a loopback host (`127.1`, `0x7f.0.0.1`,
  `[0:0:0:0:0:0:0:1]`), any userinfo (`http://localhost@evil.example/`,
  `http://evil.example@localhost/`) and every other `http:` URL.
- Theme URLs (`logo`, `webFonts`, `footer.link`) unchanged: `https:` only.
- Mail clients checked: none new (no change to the layout or styles).

## 0.1.0

First release, installed from the GitHub tag with `dist/` committed.

- `renderMail(theme, content)` returns `subject`, `html` and `text` from a theme and
  blocks; `defineTheme` validates themes (contrast, light and dark); no runtime dependency,
  runs in Cloudflare Workers and Node 22 or later.
- Built-in themes `majordome` and `dream-studio`, and sample mails (`mail-kit/samples`).
- `npm run preview` writes the preview gallery; `scripts/release.ts` builds, commits and
  tags `dist/` (with `--dry-run`); Worker and Node consumer fixtures install the packed
  tarball.
- Mail clients checked: none yet (test sends come with M2, F8.6).
