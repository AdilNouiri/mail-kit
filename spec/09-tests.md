# 9. Tests

- **Single check command**: `heavy npm run check` = `biome check`, `tsc --noEmit`,
  `vitest run` (unit and lint tests), the Worker fixture under
  `@cloudflare/vitest-pool-workers`, the Node fixture under `node --test`, then
  `npm run preview` and the pixel comparison of F2.7. Non-zero on any failure. Every task
  makes it pass.
- **Levels**:
  - Unit: `defineTheme` (F1), each block and the layout (F2), the text part (F3).
  - Lint: the F4 rules over every built-in theme × sample mail, as plain string and
    parsed checks.
  - Render: headless Chromium screenshots of the preview at both sizes and both schemes;
    F4.3 and F4.4 read computed styles and `scrollWidth` in the page; F2.7 compares with
    the mockups.
  - Consumer: the Worker and Node fixtures import the built `dist/` (F6).
  - Real clients (M2): test sends checked in Gmail web, Apple Mail in the sandbox and
    Outlook (F8); not part of the check command.
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
