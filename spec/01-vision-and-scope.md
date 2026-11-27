# 1. Vision and scope

Each tool of the owner builds its mails on its own. Majordome's magic-link mail arrives as
plain text with a flat red « Me connecter » link: no layout, no logo. Dream Studio's
mail-service has its own dark templates and no text part. Nothing is shared, so every new
tool starts from zero and none looks finished. The owner asked on 27 Nov 2026 for one
design for all their mails, with a theme per tool.

## 1.1 Users

| User | What they want to do | Frequency |
| --- | --- | --- |
| A tool's code (a consumer), written by Claude | Turn a theme and a few blocks into a finished mail in one call | Each mail sent |
| The owner | See every tool's mails look the same and finished, each in its brand | When a tool or a mail is added |
| A recipient (for example `alice.martin@example.com`) | Read the mail and act on it, in any client, light or dark, on a phone | Each mail received |

## 1.2 Goals

1. **One design**: every consumer's mail uses the same layout and blocks; only the theme
   differs.
2. **One call**: `renderMail(theme, content)` returns `subject`, `html` and `text`; the
   consumer writes no HTML or CSS.
3. **Every client**: the html renders correctly in Gmail web and mobile, Apple Mail (macOS
   and iOS) and Outlook (classic Windows and Outlook.com), in light and dark mode, at
   600 px and at 390 px.
4. **Runs anywhere**: the same package runs in a Cloudflare Worker and in Node 22 or later,
   with no runtime dependency.

## 1.3 In scope

- The theme model and its validation; the built-in themes `majordome` and `dream-studio`.
- The layout (banner, accent rule, card, footer) and the blocks heading, paragraph, button
  (with its link fallback), link, code, note and divider.
- The plain-text part built from the same content.
- Light and dark mode, Outlook's Word engine, mobile layout, accessibility basics.
- A preview gallery of every theme and sample mail, rendered to PNG.
- A test-send command to check real clients (M2).
- A versioned package consumers install from GitHub.

## 1.4 Out of scope

- Sending mail: each consumer keeps its sender (Majordome's `MailSender`, Dream Studio's
  mail-service). Different runtimes and providers; a kit that renders is enough.
- Marketing mails and newsletters (Dream Studio's fan newsletters): later, as new blocks
  (image, list) in a new milestone, once transactional mails are adopted.
- A visual editor or templates stored in a database: never, mails are code.
- Changing each consumer's code: done in that consumer's session.
- Hosting the logo images: each consumer serves its own logo PNG on its own domain
  (decision 5).

## 1.5 Platforms and constraints

- Runtime: ECMAScript 2022 modules, no `node:` import in the runtime code, no DOM, so that
  Cloudflare Workers (`workerd`) and Node 22+ both run it.
- Mail clients: no external stylesheet, no `<script>`, no SVG image, no CSS grid or flex,
  inline styles on every element, table layout, one `<style>` block only for dark mode and
  the phone width (clients that drop it still get a correct light layout).
- Gmail clips a mail whose html is over 102 KB: every rendered mail stays under 60 KB.
- Majordome's app bans the `style` attribute in its JSX (`app/rules/bans/no-style-attribute.yml`
  in the Majordome repository): mail-kit returns strings, so Majordome never writes a
  `style` attribute.
- Budget: no paid service. Resend's free plan, already used by Majordome, is enough for
  test sends.

## 1.6 Measurement

None: mail-kit is a library with no public page and no app. A consumer's mail links carry
that consumer's own tracking, if any.
