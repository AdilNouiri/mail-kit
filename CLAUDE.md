# mail-kit

One transactional email design for every tool of the owner: a consumer passes a theme and
blocks to `renderMail` and gets `subject`, `html` and `text` back. The spec in `spec/` is
the reference; read `spec/README.md` first.

## Commands

- `heavy npm run check`: the whole check (Biome, `tsc --noEmit`, `vitest run`, the Worker
  and Node consumer fixtures, `npm run preview`, the mockup comparison). Every change
  makes it pass.
- `heavy --light npm run lint`, `heavy --light npm run typecheck`,
  `heavy --light npm test`: the single steps.
- `heavy --light npm run test:assumptions`: reruns the technical assumptions of
  `test/assumptions/README.md` (not part of the check).
- Scripts in `scripts/` and `test/` run on Node 24 directly (`node scripts/preview.ts`):
  imports use the `.ts` extension; `tsc` rewrites them to `.js` when it builds `dist/`.

## Rules of the runtime code (`src/`)

- `src/` runs unchanged in a Cloudflare Worker (`workerd`) and in Node 22 or later:
  ECMAScript 2022 modules, no `node:` import, no package import (no runtime dependency),
  no DOM, no Node global. Biome enforces it on `src/**` (`noNodejsModules`,
  `noUndeclaredDependencies`, `noRestrictedGlobals`); never silence these rules.
- Rendering is pure: no I/O, no clock, no randomness, no logging (F2.8, section 8).
- `src/types.ts` holds the frozen interfaces; a change to it is a spec change first.
- Mail html: no external stylesheet, no `<script>`, no SVG image, no CSS grid or flex,
  inline styles on every element, table layout, one `<style>` block only for dark mode
  and the phone width; clients that drop it still get a correct light layout.
- Every rendered mail stays under 60 KB (Gmail clips at 102 KB).
- Every text is escaped with `src/escape.ts`; there is no raw-html block. Only `https:`
  and `mailto:` URLs are accepted.
- Majordome bans the `style` attribute in its JSX: mail-kit returns strings, so a
  consumer never writes one.
- No paid service: Resend's free plan covers the test sends (M2).

## Tests and data

- Test data: the samples of `src/samples.ts`, `example.com` addresses and fictitious
  tokens (`EXAMPLE-TOKEN-1234`); never a real address or token.
- Screenshots use `$CCS_TEST_CHROME` when set, else Playwright's
  `chromium-headless-shell`; always headless, never Google Chrome.

## Worktrees

Task worktrees live in `~/projects/platform/worktrees.noindex/mail-kit/<task>`; the
integration branch is `claude/mail-kit`. `preview/`, `dist/` and `node_modules/` are
ignored; `dist/` is committed only on a release commit (T6).
