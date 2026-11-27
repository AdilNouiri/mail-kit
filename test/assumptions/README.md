# Verified assumptions (T0)

Each assumption that later tasks build on, the command that establishes it, and its result.
Rerun them all with `heavy --light npm run test:assumptions`. They are not part of
`npm run check`: they install a nested fixture and need a headless browser.

## A1 — A Worker test imports a package installed from a `file:` path

- **Claim**: under `@cloudflare/vitest-plugin` (the renamed `@cloudflare/vitest-pool-workers`),
  a test running inside `workerd` imports a package installed with `file:`, both its `.`
  export and a `./themes/*` subpath export, the shape of `mail-kit`'s `exports`.
- **Fixture**: `tiny-lib/` (plain ES modules, `exports` with `.` and `./themes/*`) and
  `worker-file-dep/` (depends on `file:../tiny-lib`; its test checks
  `navigator.userAgent === "Cloudflare-Workers"`, so it fails outside `workerd`).
- **Commands and results** (27 Nov 2026, Node 24.22.0, vitest 5.1.2,
  `@cloudflare/vitest-plugin` 1.9.2, workerd 1.20261123.1):
  - Directory dependency (npm installs it as a symlink):
    `npm install --prefix test/assumptions/worker-file-dep --no-package-lock` then
    `heavy --light ./node_modules/.bin/vitest run --root test/assumptions/worker-file-dep`
    → exit 0, 1 test passed.
  - Packed tarball (what T6's fixtures install):
    `npm pack test/assumptions/tiny-lib --pack-destination $TMPDIR/t0-pack`, then
    `npm install --prefix test/assumptions/worker-file-dep --no-package-lock --no-save $TMPDIR/t0-pack/tiny-lib-0.0.0.tgz`
    and the same `vitest run` → exit 0, 1 test passed.
- **Notes for T6**: `--config` is read relative to `--root` in vitest 5; pass `--root` alone
  and let the fixture's `vitest.config.ts` be found. No `nodejs_compat` flag is needed.
  npm 11 skips the `postinstall` of `workerd` and `esbuild` (allowScripts); the run works
  without them.

## A2 — The headless shell honours `--blink-settings=preferredColorScheme`

- **Claim**: launched with `--blink-settings=preferredColorScheme=0`, the page matches
  `(prefers-color-scheme: dark)` and applies the dark rules; with `=1`, light.
- **Command**: `heavy --light node test/assumptions/color-scheme.ts <headless-shell path>`
  (also tries `$CCS_TEST_CHROME` and Playwright's own headless shell).
- **Result** (27 Nov 2026): exit 0. `$CCS_TEST_CHROME` (Chrome Headless Shell
  158.0.8127.18) and Playwright's `chromium_headless_shell-1254` (158.0.8127.18): flag `0`
  → dark (`rgb(0, 0, 0)`), flag `1` → light (`rgb(255, 255, 255)`).
- **Caveat that matters**: a Playwright browser context emulates `colorScheme: "light"` by
  default, and context emulation wins over the flag. Either create the context with
  `colorScheme: null` and use the flag, or (simpler, what T5 should do) leave the flag out
  and set `colorScheme: "dark" | "light"` on the context: both were checked above with
  each flag value.
- **Not verified**: `playwright-core` 1.65.1 expects `chromium_headless_shell-1255`
  (Chrome Headless Shell 159.0.8154.6), not installed on this Mac; the script skips it.
  Install it with `npx playwright-core install chromium-headless-shell` where
  `$CCS_TEST_CHROME` is not set (CI).
