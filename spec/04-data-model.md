# 4. Data model

mail-kit stores nothing: no database, no file written at run time. Its "data" are the
TypeScript types below, frozen in T0 (`src/types.ts`). Every consumer owns its themes and
contents; mail-kit owns the built-in themes.

## 4.1 Theme

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | string | required, `^[a-z0-9-]{2,40}$` | Name of the theme (`majordome`). |
| `wordmark` | string | required, 1 to 40 characters | Text beside the logo in the banner. |
| `wordmarkSpacing` | number | 0 to 6, default 0 | Letter spacing of the wordmark, in px. |
| `logo` | `{ url, width, height }` or absent | `url` absolute `https:`, `.png`/`.jpg`/`.jpeg`; `width` 16 to 200; `height` 16 to 80 | Logo shown left of the wordmark; the file is twice the display size. |
| `lang` | `"fr"` or `"en"` | default `"en"` | `<html lang>`, the fixed strings (fallback link lead, text-part labels), French spacing. |
| `colors.brand` | hex | required | Banner background. |
| `colors.onBrand` | hex | required, 4.5:1 on `brand` | Wordmark colour. |
| `colors.accent` | hex | required | Accent rule, button, note border. |
| `colors.onAccent` | hex | required, 4.5:1 on `accent` | Button label. |
| `colors.canvas` | hex | required | Background behind the card. |
| `colors.card` | hex | required | Card background. |
| `colors.text` | hex | required, 4.5:1 on `card` | Headings, code. |
| `colors.textSoft` | hex | required, 4.5:1 on `card` | Paragraphs, notes. |
| `colors.muted` | hex | required, 4.5:1 on `card` | Fallback link lead, small text. |
| `colors.subtle` | hex | required | Fill of code and note blocks; `text` and `textSoft` 4.5:1 on it. |
| `colors.link` | hex | required, 4.5:1 on `card` | Links in the card. |
| `colors.footerText` | hex | required, 4.5:1 on `canvas` | Footer text and link. |
| `dark.canvas`, `dark.card`, `dark.text`, `dark.textSoft`, `dark.muted`, `dark.subtle`, `dark.link` | hex | required, same contrast rules | The same roles under `prefers-color-scheme: dark`. Brand, accent and their "on" colours stay, so `onAccent` on `accent` is checked once. |
| `fonts.display` | string | required, ends in a generic family | Heading and wordmark stack. |
| `fonts.displayWeight` | 400, 600 or 700 | default 700 | Heading weight. |
| `fonts.text` | string | required, ends in a generic family | Body stack. |
| `webFonts` | `{ family, url, weight }[]` | optional; `url` absolute `https:` `.woff2`; at most 4 | `@font-face` rules; clients without web fonts use the stack. |
| `buttonRadius` | number | 0 to 999, default 8 | Button corner radius in px (999 = pill). |
| `footer.reason` | string | required, 1 to 300 characters | Why the recipient gets the mail. |
| `footer.legal` | string | required, 1 to 200 characters | Sender name and site, or company line. |
| `footer.link` | `{ label, url }` or absent | `url` absolute `https:` | One link, such as the privacy page. |

- Owner: the consumer (or mail-kit for a built-in theme). Validated by `defineTheme`
  (F1); `renderMail` accepts only a `Theme` that came out of it (a branded type).

## 4.2 MailContent

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| `subject` | string | 1 to 200 characters | Subject line, returned as is and used as `<title>`. |
| `preheader` | string | optional, at most 140 characters | Inbox preview line. |
| `blocks` | `Block[]` | 1 to 30 blocks | The body, in order. |
| `footerReason` | string | optional, at most 300 characters | Overrides `theme.footer.reason` for this mail. |

## 4.3 Block

A tagged union on `type`:

| `type` | Fields | Notes |
| --- | --- | --- |
| `heading` | `text` (1 to 120 characters) | One `<h1>` look; more than one heading is allowed but discouraged. |
| `paragraph` | `content`: string or `Inline[]` | |
| `button` | `label` (1 to 40), `url` (`https:`/`mailto:`), `fallback` (boolean, default true) | Followed by a fallback link unless `fallback: false`. |
| `link` | `lead` (string), `url` | A small line with a lead and the address in full. |
| `code` | `code` (1 to 12 characters, `[A-Z0-9]`), `group` (0 to 6, default 0) | One-time code; `group` inserts a space every n characters for display only. |
| `note` | `content`: string or `Inline[]` | Tinted box with the accent border. |
| `divider` | — | A 1 px line in `muted` at 30 % (`subtle` colour). |

`Inline` is a string, `{ bold: string }` or `{ text: string, url: string }`.

## 4.4 RenderedMail

| Field | Type | Description |
| --- | --- | --- |
| `subject` | string | The content's subject. |
| `html` | string | The full html document, starting with `<!doctype html>`. |
| `text` | string | The text part, lines joined with `\n`, ending with `\n`. |

- Migrations: none. A change of these types is a change of the package's major version
  when it breaks a consumer (F6).
