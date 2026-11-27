# 11. Tasks

T0 runs first and alone. Two tasks with no dependency between them never modify the same
file.

Waves: 0 = T0; 1 = T1, T2, T3; 2 = T4, T8; 3 = T5, T9; 4 = T6; 5 = T7, T10; 6 = T11.

| Task | Wave |
| --- | --- |
| T0 | 0 |
| T1 | 1 |
| T2 | 1 |
| T3 | 1 |
| T4 | 2 |
| T5 | 3 |
| T6 | 4 |
| T7 | 5 |
| T8 | 2 |
| T9 | 3 |
| T10 | 5 |
| T11 | 6 |

### T0 — Skeleton, tooling and frozen interfaces

- **Depends on**: —
- **Files**: `package.json`, `package-lock.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.gitignore`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `src/types.ts`, `src/index.ts`, `src/escape.ts`, `src/render-mail.ts`, `src/themes/index.ts`, `src/theme.ts` (placeholder, T1 replaces it), `src/html/index.ts` (placeholder, T2), `src/text.ts` (placeholder, T3), `src/themes/majordome.ts`, `src/themes/dream-studio.ts`, `src/samples.ts` (placeholders, T4), `test/escape.test.ts`, `test/assumptions/`, `spec/decisions/T0.md`
- **Agent**: `architect` (opus, effort medium: freezes the types every other task uses)
- **Priority**: high
- **Estimate**: M
- **Covers**: —
- **Content**: Node 24 project, ESM, `strict` TypeScript; pinned dev dependencies
  (TypeScript, Biome, Vitest, `@cloudflare/vitest-plugin`, Playwright core,
  `pixelmatch`, `pngjs`), versions read from npm and recorded in `spec/decisions/T0.md`.
  `npm run check` as in `09-tests.md`, with the preview and fixture steps as no-ops that
  later tasks fill. `src/types.ts` holds every type of `04-data-model.md` and the error
  classes; `src/index.ts` exports `defineTheme` from `./theme`, `renderText` from `./text`
  and `renderMail` from `./render-mail` (T1, T3 and T2 create the first two; T0 writes
  `render-mail.ts`, which calls `renderHtml` from `./html/index` and `renderText`).
  `src/escape.ts` (html text and attribute escaping, tested). `package.json` `exports`
  for `.`, `./themes/*` and `./samples`. Verify and record in `test/assumptions/`: a
  Worker fixture can import a package from a `file:` path in `@cloudflare/vitest-plugin`; the
  headless shell renders `--blink-settings=preferredColorScheme`. `CLAUDE.md`: the check
  command, the rules of `01-vision-and-scope.md` section 1.5.
- **Criterion**: `heavy npm run check` green with stub modules; types compile; assumptions
  recorded.

### T1 — Theme validation and fixed strings

- **Depends on**: T0
- **Files**: `src/theme.ts`, `src/contrast.ts`, `src/i18n.ts`, `test/theme.test.ts`, `test/contrast.test.ts`, `spec/decisions/T1.md`
- **Agent**: `implementer` (sonnet, effort medium: fully specified, criteria tested)
- **Priority**: high
- **Estimate**: S
- **Covers**: F1
- **Content**: `defineTheme` with every rule of `04-data-model.md` section 4.1, WCAG
  relative luminance contrast, deep freeze and the brand symbol; `i18n.ts` with the fr
  and en strings of F2.5 and F3.
- **Criterion**: F1.1 to F1.5 tested (F1.6 is tested by T4); check green.

### T2 — HTML layout and blocks

- **Depends on**: T0
- **Files**: `src/html/`, `test/html/`, `test/lint/`, `spec/decisions/T2.md`
- **Agent**: `implementer` (opus, effort medium: client-compatibility judgement beyond the tests)
- **Priority**: high
- **Estimate**: M
- **Covers**: F2, F4
- **Explore first**: `spec/images/src/build-mockups.mjs` and the eight PNGs of
  `spec/images/`: the markup, inline styles and `<style>` rules to reproduce; plus the
  Outlook VML button pattern (cite the source in the decision log).
- **Content**: `renderHtml(theme, content)` in `src/html/index.ts`: layout, one module
  per block, the `<style>` block for phone and dark (`prefers-color-scheme` and
  `[data-ogsc]`), the MSO frame and VML button, the version comment (F6.5), URL and
  content checks raising `ContentError`. Tests build `Theme` objects through a local
  helper that casts the brand, so T1 is not needed. The F4 lint rules over a fixture
  theme × the three block sets.
- **Criterion**: F2.1 to F2.6, F2.8 and F4.1 to F4.6 tested (F4.3 and F4.4 in headless
  Chromium); check green.

### T3 — Plain-text part

- **Depends on**: T0
- **Files**: `src/text.ts`, `test/text.test.ts`, `spec/decisions/T3.md`
- **Agent**: `implementer` (sonnet, effort medium: fully specified, criteria tested)
- **Priority**: high
- **Estimate**: S
- **Covers**: F3
- **Content**: `renderText(theme, content)`: blocks in order, 76-column wrap on spaces,
  URLs never broken, French spacing before `:` for `fr`, the footer after `--`.
- **Criterion**: F3.1 to F3.5 tested; check green.

### T4 — Built-in themes, samples and logo assets

- **Depends on**: T1
- **Files**: `src/themes/majordome.ts`, `src/themes/dream-studio.ts`, `src/samples.ts`, `assets/`, `test/themes.test.ts`, `spec/decisions/T4.md`
- **Agent**: `fast-implementer` (sonnet, effort low: values copied from themes.json)
- **Priority**: high
- **Estimate**: S
- **Covers**: F7
- **Content**: the two themes from `spec/images/src/themes.json` through `defineTheme`;
  `samples.ts` with `magic-link`, `code` and `notice` in fr and en (the mockup texts);
  `assets/majordome/mail-logo.png` and the fonts copied from
  `spec/images/src/assets/`, SHA-256 in `assets/README.md`.
- **Criterion**: F1.6 and F7.1 to F7.3 tested; check green.

### T5 — Preview gallery and mockup comparison

- **Depends on**: T2, T3, T4
- **Files**: `scripts/preview.ts`, `test/preview.test.ts`, `test/mockup-match.test.ts`, `vitest.config.ts`, `package.json`, `spec/decisions/T5.md`
- **Agent**: `implementer` (sonnet, effort medium: fully specified, criteria tested)
- **Priority**: high
- **Estimate**: M
- **Covers**: F5, F2
- **Content**: `npm run preview` writes html, txt, index and PNGs (light and dark, both
  sizes) with logo and font URLs mapped to `assets/`; the F2.7 comparison against
  `spec/images/` with `pixelmatch`; the preview step of `npm run check`.
- **Criterion**: F5.1 to F5.3 and F2.7 tested; check green.

### T6 — Release, consumer fixtures and the first tag

- **Depends on**: T5, T8
- **Files**: `scripts/release.ts`, `test/consumers/`, `package.json`, `README.md`, `CHANGELOG.md`, `spec/decisions/T6.md`
- **Agent**: `implementer` (sonnet, effort medium: fully specified, criteria tested)
- **Priority**: high
- **Estimate**: M
- **Covers**: F6
- **Prerequisites**: P1
- **Content**: `release.ts` builds `dist/` from `src/` with `tsc` and explicit options
  (`--rewriteRelativeImportExtensions --declaration`; `tsconfig.json` is the no-emit
  development config, `decisions/T0.md` D4), commits it in one commit on a detached
  HEAD (a child of `origin/main`), tags that commit `v<version>` and pushes only the tag,
  so `main` never holds `dist/` (`decisions/T6.md` D2); Worker and Node
  fixtures that install the packed tarball; `README.md` usage with the Majordome example
  of `06-api.md`. Tag `v0.1.0` once M1's pull request is merged.
- **Criterion**: F6.1 to F6.5 tested; check green; `v0.1.0` installable from GitHub.

### T7 — Test sends and real-client checks

- **Depends on**: T6
- **Files**: `scripts/send-test.ts`, `test/send-test.test.ts`, `CHANGELOG.md`, `spec/decisions/T7.md`
- **Agent**: `tester` (sonnet, effort medium: verification against criteria)
- **Priority**: medium
- **Estimate**: M
- **Covers**: F8
- **Prerequisites**: P2
- **Content**: `send-test` with an injected `fetch` (unit-tested without network), the
  mailbox allow-list, the 429 retry; then the real sends and the Gmail web, Apple Mail
  (sandbox) and Outlook screenshots, sent to CCS with the verification report.
  Note (27 Nov 2026): T11 runs after T7 and writes the `0.1.1` release notes in
  `CHANGELOG.md` and the version bump in `package.json`; T7 adds only its own entry under
  its own heading in `CHANGELOG.md` and writes neither the `0.1.1` heading nor the
  version.
- **Criterion**: F8.1 to F8.6 checked; report sent; check green.

### T8 — Long codes on phones and the CI workflow (light batch)

- **Depends on**: T2
- **Files**: `src/html/blocks/code.ts`, `test/lint/code-width.test.ts`, `.github/workflows/check.yml`, `spec/decisions/T8.md`
- **Agent**: `implementer` (sonnet, effort medium: two small items, fully specified, criteria tested)
- **Priority**: high
- **Estimate**: S
- **Covers**: F4
- **Content**: a light batch of two items found by T2:
  - [ ] `renderCode` sets the code cell's inline `font-size` and `letter-spacing` from
    the displayed length n (code plus group spaces): n ≤ 12 keeps 30 px and 8 px (no
    change to the mockups); 13 ≤ n ≤ 16 uses 22 px and 4 px; 17 ≤ n ≤ 23 uses 16 px and
    2 px, `line-height` scaled to match, `white-space:nowrap`. Inline, not in the
    `<style>` block, so it also fits a client that drops that block and the 600 px
    desktop card. F4.7 tested in headless Chromium with the helpers of
    `test/lint/browser.ts`, plus a check that the `code` sample's markup is unchanged.
  - [x] `.github/workflows/check.yml`, a first workflow (merged). Its push trigger and
    browser tests on GitHub broke the CI rule; T9 replaces it (decision 12).
- **Criterion**: F4.7 tested; check green on the Mac.

### T9 — CI workflow per the CI rule (light)

- **Depends on**: T8
- **Files**: `.github/workflows/check.yml`
- **Agent**: `fast-implementer` (sonnet, effort low: one workflow file, fully specified)
- **Priority**: high
- **Estimate**: S
- **Covers**: F4
- **Content**: rewrite `check.yml` per `rules/code/ci-workflows.md` of `claude-memory`,
  on the model of `template-node`'s `.github/workflows/ci.yml` but without its copy mode:
  - `on`: `pull_request` with `types: [opened, synchronize, reopened,
    ready_for_review, labeled]` and `paths-ignore: ['**/*.md', 'spec/**', 'docs/**']`,
    plus `workflow_dispatch`; never `push`. With `paths-ignore` the check is not a
    required check (`template-node`'s `scripts/protect-default-branch.ts` leaves out a
    workflow that filters by path), so no copy mode and no `scripts/ci/`.
  - One job `check`, `ubuntu-latest`, with the rule's exact one-line `if` on the job,
    job-level `concurrency` on `${{ github.workflow }}-${{ github.ref }}` with
    `cancel-in-progress: true`, `timeout-minutes: 10` (about twice a quick check),
    `permissions: contents: read`.
  - Steps: `actions/checkout` (`persist-credentials: false`), `actions/setup-node`
    (Node 24, npm cache), `npm ci`, `npx biome ci`, `npx tsc --noEmit`,
    `npx vitest run --exclude test/lint/browser.test.ts --exclude
    test/lint/code-width.test.ts --exclude test/mockup-match.test.ts --exclude
    test/preview.test.ts` (the config's own excludes still apply: check it). No
    Playwright install, no `npm run` script: T6 reworks `package.json` in parallel.
  - Action major versions as in `template-node` (`checkout@v7`, `setup-node@v7`).
- **Criterion**: `actionlint`-clean or read line by line against the rule; the quick
  steps run on the Mac with the same commands and pass; the first run on the pull request
  of M1 (or a `workflow_dispatch`) green with no browser test started.

### T10 — Node 22 run of the Node fixture (light)

- **Depends on**: T6
- **Files**: `package.json`, `spec/decisions/T10.md`
- **Agent**: `fast-implementer` (sonnet, effort low: one script, fully specified)
- **Priority**: high
- **Estimate**: S
- **Covers**: F6
- **Content**: F6.3 says Node 22, and the Mac runs Node 24. Add a script
  `test:node22` that runs the Node consumer fixture (`test/consumers/node/*.test.mjs`,
  after T6's `test/consumers/prepare.ts node`) with
  `npx -y node@22.23.5 --test …` (the `node` npm package; 22.23.5 is the newest 22.x on
  the registry, published 12 Nov 2026, read with `npm view node@22 version`), and call it
  in `check` right after `test:node`. **UNVERIFIED**: that `npx node@22.23.5` runs on
  darwin-arm64 without a global install; verify first and record it in
  `spec/decisions/T10.md`; if it fails, use another pinned Node 22 that needs no global
  change (a cached download under the system temp folder) and record which. Mac only,
  never in CI.
- **Criterion**: `npm run test:node22` passes and prints `v22.23.5` from
  `process.version` in the fixture's run; `heavy npm run check` green.

### T11 — Loopback `http:` links and release 0.1.1

- **Depends on**: T6, T7, T10
- **Files**: `src/escape.ts`, `src/html/check.ts`, `src/types.ts`, `test/escape.test.ts`, `test/html/render.test.ts`, `test/text.test.ts`, `test/theme.test.ts`, `CLAUDE.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `README.md`, `spec/decisions/T11.md`
- **Agent**: `implementer` (opus, effort high: security, URL validation)
- **Priority**: high
- **Estimate**: S
- **Covers**: F2
- **Content**: found by the Majordome session adopting v0.1.0: its magic link is built
  from the request origin, `http://localhost:<port>` or `http://127.0.0.1:<port>` under
  `wrangler dev` and its Playwright e2e harness, so every button and link block threw a
  `ContentError` and its local sign-in answered 500 (`decisions/T6.md` D5, decision 13).
  - Content URLs (button, link block, inline link) accept loopback `http:` exactly as
    F2.9 says; `src/theme.ts` keeps `https:` only and is not changed: extend
    `isAllowedUrl` so its existing callers keep their meaning (for example a separate
    scheme value used only by `src/html/check.ts`), and update the `ContentError`
    message. The text part follows through `renderHtml`'s checks
    (`src/render-mail.ts`); test it anyway.
  - Tests: every accepted and refused URL of F2.9 in `test/escape.test.ts`, the button
    (`href` and fallback link), the link block and an inline link in
    `test/html/render.test.ts` and `test/text.test.ts`, and a loopback logo,
    web font and footer link still refused in `test/theme.test.ts`.
  - `src/types.ts`: the `url` doc comments of the button, link and inline link, and
    `VERSION` to `0.1.1` (`scripts/release.ts` refuses a `VERSION` that differs from
    `package.json`); `package.json` and `package-lock.json` (`npm version 0.1.1
    --no-git-tag-version`); `README.md`'s install line to `#v0.1.1`.
  - `CLAUDE.md`: the URL rule line becomes "Only `https:` and `mailto:` URLs are accepted,
    plus loopback `http:` in content blocks (F2.9); theme URLs are `https:` only."
  - `CHANGELOG.md`: a `0.1.1` heading above `0.1.0` with the release notes (loopback
    `http:` in content, the lookalikes refused, theme unchanged, mail clients checked as
    T7 recorded); T7's own entry stays where T7 put it.
  - The tag `v0.1.1` itself is made by the loop from `main` after the integration pull
    request merges, with `scripts/release.ts`, as T6 describes (`decisions/T6.md` D2);
    this task does not tag.
- **Criterion**: F2.9 tested with every lookalike, userinfo, shorthand and uppercase case
  it names, and F2.4 still tested; theme URLs still refuse `http:`; `heavy npm run check`
  green; `CHANGELOG.md` has a `0.1.1` entry; `VERSION`, `package.json` and
  `package-lock.json` say `0.1.1`.
