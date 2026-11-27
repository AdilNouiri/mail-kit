# 7. Architecture

## 7.1 Components

```
consumer (Majordome Worker, Node service)
   │  renderMail(theme, content)
   ▼
src/render-mail.ts ──► src/html/   layout + one module per block, inline styles, <style> for dark and phone
                   └─► src/text.ts  text part from the same blocks
src/theme.ts  defineTheme: validation, defaults, contrast (src/contrast.ts), freeze
src/i18n.ts   fixed strings per lang (fallback lead, "Code", button separator)
src/themes/   built-in themes, one file each
src/samples.ts sample mails for preview and tests
scripts/preview.ts    writes preview/ and drives headless Chromium for PNGs   (Node only)
scripts/send-test.ts  POSTs one rendered mail to Resend                       (Node only)
```

The consumer sends the returned strings with its own sender. `src/` never imports
`scripts/`, Node built-ins or any package, so `dist/` runs in `workerd` and Node.

## 7.2 Technical choices

| Area | Choice | Version (source, date) | Reason |
| --- | --- | --- | --- |
| Language | TypeScript, ES2022 modules, `strict` | 7.0.2 (npm, 27 Nov 2026, `decisions/T0.md`) | Typed themes and blocks catch errors in the consumer's editor. |
| Html building | Template strings with one `escape` function, no library | — | Zero dependency, runs in Workers; MJML needs Node and is large; React Email needs React, which Majordome does not use. |
| Tests | Vitest; `@cloudflare/vitest-plugin` for the Worker fixture | vitest 5.1.2, @cloudflare/vitest-plugin 1.9.2 (npm, 27 Nov 2026; `@cloudflare/vitest-pool-workers` is deprecated in its favour) | Majordome already uses both, so the fixture matches its setup. |
| Lint and format | Biome | 2.6.9 (npm, 27 Nov 2026) | Same as Majordome's app. |
| Screenshots | Playwright's `chromium-headless-shell`, or `$CCS_TEST_CHROME` | playwright-core 1.65.1 (npm, 27 Nov 2026); the browser context sets `colorScheme`, which overrides the shell's flag (`decisions/T0.md`) | Headless, never Google Chrome (`rules/tools/browser.md`). |
| Image diff | `pixelmatch` + `pngjs`, dev dependencies only | pixelmatch 8.0.0, pngjs 7.0.0 (npm, 27 Nov 2026) | F2.7 compares renders with the mockups. |
| Distribution | Git tag on GitHub; `dist/` only in the tagged commit, a detached child of `main` whose tag alone is pushed (`main` never holds `dist/`, `decisions/T6.md` D2) | — | No registry account, no install script in the consumer (decision 3, open question 1). |

## 7.3 Repository layout

```
mail-kit/
  spec/                 this specification
  src/                  runtime code, no Node import
    types.ts            frozen interfaces (T0)
    index.ts            public exports (T0)
    theme.ts contrast.ts i18n.ts
    html/               layout.ts and one file per block
    text.ts render-mail.ts escape.ts
    themes/             majordome.ts dream-studio.ts, one per built-in theme
    samples.ts
  scripts/              preview.ts send-test.ts release.ts (Node only)
  assets/               logo PNGs and fonts for the preview, per theme, with SHA-256 in README.md
  test/                 unit tests; consumers/worker and consumers/node fixtures; lint rules for F4
  dist/                 built output, committed at each tag only (release.ts)
  preview/              generated, ignored by git
  CHANGELOG.md  CLAUDE.md  README.md  package.json
```

## 7.4 External services

- **Resend** (F8 only): `POST https://api.resend.com/emails` with a Bearer key, the same
  call as Majordome's `src/mail/resend.ts`. Down → the test send fails with its status;
  rendering is unaffected.
- **GitHub**: hosts the repository and the tags consumers install. Down → consumers
  keep their installed version.
- **The consumer's domain** serves its logo PNG and web fonts (decision 5). Down → the
  logo shows its empty `alt` and the fonts fall back; the mail stays readable.
