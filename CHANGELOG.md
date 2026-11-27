# Changelog

Every tag `v<major>.<minor>.<patch>` is listed here. A breaking change bumps the major and
gives the migration; each release records which mail clients were checked (F8.6).

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
