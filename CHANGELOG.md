# Changelog

Every tag `v<major>.<minor>.<patch>` is listed here. A breaking change bumps the major and
gives the migration; each release records which mail clients were checked (F8.6).

## Unreleased

- `npm run send-test` sends one theme and sample through Resend to Claude's mailboxes.
- Mail clients checked: none. The 6 built-in pairs were delivered to Claude's mailbox, but
  Gmail web, Apple Mail (sandbox) and Outlook.com could not be opened (no web or IMAP
  mailbox of Claude's); classic Outlook is not checked. See `spec/decisions/T7.md`.

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
