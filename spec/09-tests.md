# 9. Tests

- **Single check command**: `heavy npm run check` = `biome check`, `tsc --noEmit`,
  `vitest run` (unit and lint tests), the Worker fixture under
  `@cloudflare/vitest-plugin`, the Node fixture under `node --test`, then
  `npm run preview` and the pixel comparison of F2.7. Non-zero on any failure. Every task
  makes it pass.
- **Levels**:
  - Unit: `defineTheme` (F1), each block and the layout (F2), the text part (F3).
  - Lint: the F4 rules over every built-in theme × sample mail, as plain string and
    parsed checks.
  - Render: headless Chromium screenshots of the preview at both sizes and both schemes;
    F4.3 and F4.4 read computed styles and `scrollWidth` in the page; F2.7 compares with
    the mockups.
  - Consumer: the Worker and Node fixtures import the built `dist/` (F6); the Node
    fixture runs on the Mac's Node 24 and again on Node 22 (F6.3, T10).
  - Clients (M2): Apple Mail's Quick Look renderer in the sandbox, Gmail web and
    Outlook.com emulated in the headless test Chrome (F8, decision 14); not part of the
    check command.
- **Where each test runs** (decision 12): GitHub CI runs only the quick check, one Linux
  job of `.github/workflows/check.yml` (T9) on pull requests and `workflow_dispatch`,
  never on push: `npm ci`, `npx biome ci`, `npx tsc --noEmit`, and `npx vitest run`
  with `--exclude` for the browser files `test/lint/browser.test.ts`,
  `test/lint/code-width.test.ts`, `test/mockup-match.test.ts` and
  `test/preview.test.ts`. Those files, the Worker and Node consumer fixtures (they build
  and pack `dist/`), the Node 22 run of the Node fixture (T10), `npm run preview` and the
  mockup comparison run only on the Mac, in `heavy npm run check`: `open-pr` before the
  `ci` label, the integrator before each push of `claude/mail-kit`, and `after-merge`.
  No browser is installed on GitHub.
- **Test data**: the sample mails of `src/samples.ts` and fixtures with `example.com`
  addresses and fictitious tokens (`EXAMPLE-TOKEN-1234`); never a real address or token.
- **System and GUI tests**: Apple Mail runs only through `sandbox run -- <command>`
  (`rules/tools/test-sandbox.md`), never on the Host; the Windows VM is started and
  stopped by Claude.
- **Test browsers**: the screenshots start `process.env.CCS_TEST_CHROME` when set, else
  Playwright's `chromium-headless-shell`, always headless, never Google Chrome.
- Every acceptance criterion has at least one test, named after its identifier (`F3.2`);
  F8.3 to F8.6 are checked by the M2 verification report.
- **Timing**: nothing in mail-kit depends on time; rendering is pure (F2.8). The screenshot
  step waits for the page's `load` event and fonts (`document.fonts.ready`), never a fixed
  delay; it runs as `heavy --steady`.
