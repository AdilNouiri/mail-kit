# Changelog

Every tag `v<major>.<minor>.<patch>` is listed here. A breaking change bumps the major and
gives the migration; each release records which mail clients were checked (F8.6).

## Unreleased

- `npm run send-test` sends one theme and sample through Resend to Claude's mailboxes.
- Mail clients checked, over the 6 built-in theme and sample pairs, without any mailbox
  (decision 14); screenshots are in the CCS verification report of F8
  (report dc86cfbf-6dbf-4522-999f-0d8f80c29202, review page
  `http://127.0.0.1:4500/review.html#/review/mail-kit/AdilNouiri%2Fmail-kit/spec/F8`):
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
