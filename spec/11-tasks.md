# 11. Tasks

T0 runs first and alone. Two tasks with no dependency between them never modify the same
file.

Waves: 0 = T0; 1 = T1, T2, T3; 2 = T4, T8; 3 = T5, T9; 4 = T6; 5 = T10; 6 = T11; 7 = T7; 8 = T12; 9 = T13; 10 = T14; 11 = T15; 12 = T16.

| Task | Wave |
| --- | --- |
| T0 | 0 |
| T1 | 1 |
| T2 | 1 |
| T3 | 1 |
| T4 | 2 |
| T5 | 3 |
| T6 | 4 |
| T7 | 7 |
| T8 | 2 |
| T9 | 3 |
| T10 | 5 |
| T11 | 6 |
| T12 | 8 |
| T13 | 9 |
| T14 | 10 |
| T15 | 11 |
| T16 | 12 |

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

- **Depends on**: T6, T10, T11
- **Files**: `scripts/send-test.ts`, `test/send-test.test.ts`, `CHANGELOG.md`, `package.json`, `spec/decisions/T7.md`
- **Agent**: `tester` (sonnet, effort medium: verification against criteria)
- **Priority**: medium
- **Estimate**: M
- **Covers**: F8
- **Prerequisites**: P2
- **Content**: `send-test` with an injected `fetch` (unit-tested without network), the
  mailbox allow-list, the 429 retry; then the real sends and the Gmail web, Apple Mail
  (sandbox) and Outlook screenshots, sent to CCS with the verification report.
  Note (27 Nov 2026): T11 runs before T7 (`decisions/T6.md` D5) and writes the `0.1.1`
  release notes in `CHANGELOG.md` and the version bump in `package.json`. The integration
  branch is merged into the task branch (by the integrator) after T11 merges, before
  T7's own merge; T7 writes its entry in
  `CHANGELOG.md` as an `## Unreleased` section above T11's `## 0.1.1` (the mail clients
  checked belong to the next release, since `0.1.1` ships without them), and changes
  neither the `0.1.1` section nor the version. In `package.json`, T7 only adds the
  `send-test` script line that `06-api.md` requires.
  Note (27 Nov 2026): the Gmail web, Apple Mail and Outlook checks (F8.3 to F8.5) move to
  T12: Claude's vault mailbox (Cloudflare Email Routing) has no web client and no IMAP
  (`decisions/T7.md` D7, assumption 3). T7 keeps the script, its tests, the real sends
  and F8.1, F8.2 and F8.6.
- **Criterion**: F8.1, F8.2 and F8.6 checked; F8.3 to F8.5 moved to T12; report sent;
  check green.

### T12 — Client checks without mailboxes

- **Depends on**: T7
- **Files**: `CHANGELOG.md`, `spec/decisions/T12.md`, `test/clients/` (any screenshot recipe it needs)
- **Agent**: `tester` (sonnet, effort medium: verification against criteria)
- **Priority**: medium
- **Estimate**: M
- **Covers**: F8
- **Content**: F8.3 to F8.5 without any mailbox (decision 14), over every built-in
  theme × sample rendered by `renderMail` (the mails T7 sent). Before writing the
  emulations, read Gmail's CSS documentation
  (`https://developers.google.com/workspace/gmail/design/css`) and the caniemail data
  for `gmail` and `outlook-com` (`https://github.com/hteumeuleu/caniemail`), and cite in
  `spec/decisions/T12.md` the source of each rule applied; a rule without a source is not
  applied. Gmail (variants A and B) and Outlook.com (`x_` prefixes) are emulated by a
  script of `test/clients/` that transforms the html and screenshots it with
  `$CCS_TEST_CHROME`, headless. Apple Mail: the `.eml` files are opened with
  `qlmanage -p` (Mail's Quick Look extension) inside `sandbox run`, guest in light then
  dark appearance, `screencapture` in the guest; never on the host screen. If the
  extension does not render in the guest, the fallback is Playwright's WebKit, headless,
  and F8.4 is then reported as emulated. Recipes (`sandbox.json`, scripts) live under
  `test/clients/` and run on demand, not in `npm run check`. Screenshots go to CCS with
  the verification report, each criterion marked "emulated" or "real renderer" as F8
  says. `CHANGELOG.md`: the clients checked, each with its mark, go into T7's
  `## Unreleased` section (F8.6).
- **Criterion**: F8.3 and F8.5 checked as emulated and F8.4 with Apple Mail's renderer
  (or as emulated after the fallback), with screenshots; no criterion reported as passed
  in real Gmail or real Outlook; report sent; F8.6's `CHANGELOG.md` line lists each
  client with its mark; check green.

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

- **Depends on**: T6, T10
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
  - `CHANGELOG.md`: a `## 0.1.1` section above `## 0.1.0` whose release notes cover the
    loopback change only (loopback `http:` in content, the lookalikes and userinfo
    refused, theme URLs unchanged, mail clients checked: none new); T7 adds its own
    `## Unreleased` section above it later.
  - The tag `v0.1.1` itself is made by the loop from `main` after the integration pull
    request merges, with `scripts/release.ts`, as T6 describes (`decisions/T6.md` D2);
    this task does not tag.
- **Criterion**: F2.9 tested with every lookalike, userinfo, shorthand and uppercase case
  it names, and F2.4 still tested; theme URLs still refuse `http:`; `heavy npm run check`
  green; `CHANGELOG.md` has a `0.1.1` entry; `VERSION`, `package.json` and
  `package-lock.json` say `0.1.1`.

The four tasks below apply the project's final review (28 Nov 2026, verdict mergeable,
12 non-blocking points; decision 15) and ship as `0.1.2`. They run one after the other:
T13 and T14 share `src/render-mail.ts` and `src/text.ts`, T15 regenerates the `.eml` files
after T14's text-part change, and T16 bumps the version last. Each item names its review
point; the review file is quoted where a task needs its measurements.

### T13 — Hardening: URLs, CSS values, malformed content, send-test output

- **Depends on**: T12
- **Files**: `src/escape.ts`, `src/theme.ts`, `src/html/css.ts`, `src/html/check.ts`, `src/render-mail.ts`, `src/text.ts`, `scripts/send-test.ts`, `test/escape.test.ts`, `test/theme.test.ts`, `test/html/render.test.ts`, `test/html/fixtures.ts`, `test/send-test.test.ts`, `test/text.test.ts`, `test/lint/compat.test.ts`, `spec/decisions/T13.md`
- **Agent**: `implementer` (opus, effort high: security, URL validation, escaping, secret output)
- **Sensitive**: security (URL and CSS value validation, escaping) and a secret that must never reach the output.
- **Priority**: high
- **Estimate**: M
- **Covers**: F1, F2, F8
- **Content**: a light batch of hardening items, one test each, named after its criterion.
  - [ ] Point 5, F2.10: `isAllowedUrl` refuses userinfo, `\`, the bidi controls and the
    zero-width characters for every scheme, content and theme URLs alike.
  - [ ] Point 6, F1.7: `defineTheme` refuses `&`, control characters and the characters
    `cssValue` strips in `fonts.display`, `fonts.text` and `webFonts[].family`;
    `cssValue` also strips `&`; its doc comment says why.
  - [ ] Point 7 and the empty-paragraph item of point 8, F2.11: `checkRichText` refuses an
    inline whose `bold` is present and not a string; the block check loops by index, so a
    hole is a `ContentError`; an empty or blank paragraph or note text and an empty
    `footerReason` are refused.
  - [ ] Point 12, F2.12 and F1.8: `renderText` runs the content checks `renderMail` runs;
    `defineTheme` records each theme it returns (a module `WeakSet`), and `renderMail` and
    `renderText` throw `ThemeError` (`path` `theme`) for any other object. The built-in
    themes and `test/html/fixtures.ts` go through `defineTheme` (`testTheme` calls it; the
    stand-ins stay, built with `defineTheme`, and the stale comment naming T1 goes).
    Verify the Worker and Node fixtures still pass (they import built-in themes).
  - [ ] Point 9, F8.7: the three messages of `scripts/send-test.ts` that print
    `input.theme`, `input.sample` and `input.to` list the accepted values or say the
    address is not in `MAIL_KIT_TEST_MAILBOXES`; both cases added to
    `test/send-test.test.ts` with a key-shaped value that must not appear in the output.
    Moved here from the batch of plain fixes because it guards a secret (the grid gives
    secrets to `opus`).
- **Criterion**: F1.7, F1.8, F2.10, F2.11, F2.12 and F8.7 tested; every URL and value of
  review points 5 and 6 refused in a test; no rendered sample changes (the `.eml` freshness
  is checked by T15); `heavy npm run check` green.

### T14 — Plain fixes: note links, built-in lint cases, size guard, text part

- **Depends on**: T13
- **Files**: `src/html/style.ts`, `src/html/rich-text.ts`, `src/html/blocks/note.ts`, `src/render-mail.ts`, `src/text.ts`, `test/lint/compat.test.ts`, `test/lint/browser.test.ts`, `test/lint/code-width.test.ts`, `test/text.test.ts`, `spec/decisions/T14.md`
- **Agent**: `implementer` (sonnet, effort medium: fully specified, criteria tested)
- **Priority**: medium
- **Estimate**: M
- **Covers**: F3, F4
- **Content**: a light batch, one test each, named after its criterion.
  - [ ] Point 1, F4.9: an inline link inside a note takes the note's own text colour,
    underlined: inline style `textSoft` in light, and a dark rule (`.mk-note .mk-link`,
    plus its `[data-ogsc]` copy) to `dark.text`; a fixture with a link in a note in
    `test/lint/browser.test.ts` measures 4.5:1 in both schemes for both built-in themes.
  - [ ] Point 2: `test/lint/compat.test.ts`, `browser.test.ts` and `code-width.test.ts`
    build their cases from `builtInThemes` and the samples of `src/samples.ts`, keeping the
    `notice` fixture of `test/html/fixtures.ts` for the link block and the inline link no
    sample holds (read it, do not change it: T13 owns it).
  - [ ] Point 3, F4.8: `renderMail` measures the html in UTF-8 bytes (`TextEncoder`) and
    throws `ContentError` (`field` `html`, the size in the message) above 100,000; tests
    with 30 buttons of 2,000-character URLs (refused) and the samples (accepted, under
    60 KB).
  - [ ] Point 8, F3.3 and F3.5: headings wrap at 76 like other lines and the `=` line has
    the length of the longest heading line in grapheme clusters (`Intl.Segmenter`);
    words split on `[ \t\r\n]+` only, so U+00A0 and U+202F stay. **UNVERIFIED**: that
    `Intl.Segmenter` exists in `workerd`; the Worker fixture of the check proves it; if it
    does not, count code points and record it in `spec/decisions/T14.md`.
- **Criterion**: F3.3, F3.5, F4.8 and F4.9 tested; the F4 lint and browser tests run over
  every built-in theme × sample; `heavy npm run check` green (the committed `.eml` files
  may go stale here: T15 regenerates them).

### T15 — Release script, docs and the `.eml` freshness check

- **Depends on**: T14
- **Files**: `scripts/release.ts`, `test/consumers/release/release.test.ts`, `package.json`, `README.md`, `CLAUDE.md`, `test/clients/apple-mail/eml/`, `spec/decisions/T15.md`
- **Agent**: `fast-implementer` (sonnet, effort low: mechanical, fully specified script and docs changes)
- **Priority**: medium
- **Estimate**: S
- **Covers**: F6, F8
- **Content**: a light batch.
  - [ ] Point 10, F6.6 and F6's identity edge case: the real mode of `scripts/release.ts`
    no longer sets `user.name` and `user.email` and refuses when git has no identity;
    `--dry-run` keeps the stand-in identity in its temporary clone; both modes refuse a
    `VERSION` without a `## <version>` heading in `CHANGELOG.md`. Tests in
    `test/consumers/release/release.test.ts`.
  - [ ] Point 11, F8.8: `node test/clients/run.ts` rewrites the `.eml` files after T14,
    and `package.json`'s `check` script runs `node test/clients/run.ts --verify` after
    `test:mockup`.
  - [ ] Point 11: `README.md`'s URL line adds loopback `http:` in content (F2.9), and the
    README gains `npm run send-test` (06-api) and the client recipes of `test/clients/`
    (all emulated, decision 14); `CLAUDE.md`'s size line becomes "The samples stay under
    60 KB (F4.5); `renderMail` refuses html over 100,000 bytes (F4.8)."
- **Criterion**: F6.6 and F8.8 tested; `npm run check` runs the `.eml` verify step and is
  green with `heavy`; the README and `CLAUDE.md` lines as above.

### T16 — Release 0.1.2

- **Depends on**: T13, T14, T15
- **Files**: `src/types.ts`, `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `test/clients/apple-mail/eml/`, `spec/decisions/T16.md`
- **Agent**: `fast-implementer` (sonnet, effort low: mechanical version bump and release notes)
- **Priority**: medium
- **Estimate**: S
- **Covers**: F6, F8
- **Content**: `VERSION` in `src/types.ts`, `package.json` and `package-lock.json`
  (`npm version 0.1.2 --no-git-tag-version`) to `0.1.2`; `README.md`'s install line to
  `#v0.1.2`; `CHANGELOG.md`: the `## Unreleased` section becomes `## 0.1.2`, with the
  T13 to T15 changes (the hardening of F1.7, F1.8, F2.10 to F2.12 named as possibly
  breaking only for a caller that relied on them: a cast theme, an empty `footerReason`,
  a URL with userinfo) and the clients line of F8.6, each client marked "emulated", the
  report named by its CCS report id instead of the `http://127.0.0.1` address (review
  point 11); the `.eml` files rewritten with `node test/clients/run.ts`, since the version
  stamp changes. The tag `v0.1.2` is made by the loop from `main` after the integration
  pull request merges, with `scripts/release.ts` (`decisions/T6.md` D2, as for T11); this
  task does not tag.
- **Criterion**: `VERSION`, `package.json` and `package-lock.json` say `0.1.2`;
  `CHANGELOG.md` has `## 0.1.2` with every client marked and no local address; the
  release tests (F6.6, run by the check) pass; `heavy npm run check` green.
