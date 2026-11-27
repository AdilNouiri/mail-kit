# 12. Decisions

## 12.1 Decisions

1. **mail-kit renders, consumers send.** Majordome sends through `fetch` in a Worker,
   Dream Studio through a Hono service with the Resend SDK; one sender would fit neither.
   Rejected: a shared mail service (a new deployed service and a network hop for every
   magic link).
2. **Template strings with escaping, no MJML or React Email.** Zero runtime dependency and
   Worker-compatible. Rejected: MJML (Node-only, heavy), React Email (needs React;
   Majordome uses `hono/jsx`), a CSS inliner (styles are written inline from the start).
3. **Distributed as git tags with `dist/` in the tagged commit.** No registry account, no
   install-time build in the consumer. Rejected: npm publish (a public package for a
   personal kit), GitHub Packages (a token in every consumer's install, as Dream Studio
   already suffers), vendoring a copied file (no version trail).
4. **Built-in themes live in mail-kit.** One place to see every tool's mails and to test
   every theme against the contrast and lint rules; a consumer may still pass its own
   theme.
5. **Each consumer hosts its logo PNG and web fonts on its own domain.** The mail's links
   and images then match the sender's domain, which helps spam filters and needs no new
   hosting. Rejected: one shared asset host.
6. **Light card by default, dark mode by media query.** Gmail and Outlook apps apply their
   own dark mode anyway; a light-first design inverts cleanly, and the dark brand banner
   stays readable both ways. Rejected: dark-only mails (Dream Studio's current look),
   which some clients invert into low contrast.
7. **Dream Studio's button pink is `#db1a83`, not `#e91e8c`.** White on `#e91e8c` is
   4.18:1, under the 4.5:1 that F1.4 requires; `#db1a83` gives 4.68:1 and looks the same.
8. **Majordome's theme uses its site's real colours.** The brief said navy, cream and
   orange; `public/site.css` says livery green `#14332e`, linen `#eef1ec` and lacquer red
   `#c8372d`, which are Majordome's brand. The site wins.
9. **Dream Studio is the second theme of the preview.** It is the only other tool of the
   owner that sends mail today (`mail-service`); its fan newsletters stay out of scope
   (marketing, section 1.4), but its sign-in or notice mails can adopt the kit.
10. **Mockups are real mail html, not static pages on `mockup.css`.** A mail carries no
    external stylesheet; the mockup generator doubles as the visual reference of F2.7.
11. **Built-in fonts fall back by design.** Gmail and Outlook ignore web fonts, so every
    stack ends in safe families (Georgia, system sans-serif); the look must hold with the
    fallback, which the Gmail check of F8.3 shows.
12. **GitHub CI runs only the quick check; browser and consumer tests run on the Mac.**
    The CI rule (`rules/code/ci-workflows.md` of `claude-memory`) allows one Linux job on
    pull requests and `workflow_dispatch`, never on push, with lint, typecheck and unit
    tests only, so GitHub minutes stay within the plan. T8's first workflow ran the whole
    check with a Playwright install on push; T9 replaces it. The browser tests (F2.7,
    F4.3, F4.4, F4.7, the preview), the consumer fixtures and the Node 22 run (T10) run in
    `heavy npm run check` on the Mac (open-pr, the integrator, after-merge). The
    workflow has `paths-ignore` for Markdown and `spec/`, so it is not a required check
    and needs no copy mode. Rejected: Playwright on GitHub (heavy, against the rule); a
    second job on Node 22 (light CI is one job).
13. **Loopback `http:` links are accepted in content, never in the theme.** Majordome's
    magic link comes from the request origin, `http://localhost:<port>` under
    `wrangler dev` and its e2e harness, so its local sign-in failed with a `ContentError`
    on v0.1.0. A loopback link opens only on the reader's machine (section 8). The host
    must be `localhost`, `127.0.0.1` or `[::1]` both as written (ignoring case) and after
    WHATWG parsing, so uppercase passes and shorthand spellings (`127.1`) do not; any
    userinfo is refused. Theme URLs (logo, web fonts, footer link) stay `https:`: a theme is fixed
    when the consumer is built, its logo and fonts load on the recipient's side where a
    loopback address never serves them, and no consumer has asked. Rejected: an opt-in
    option of `renderMail` (changes the frozen API for a risk section 8 finds absent);
    each consumer rewriting its local URL to `https:` (every consumer repeats it and its
    e2e tests no longer open the link); accepting every `http:` URL (clear text on the
    network).

## 12.2 Assumptions

| # | Assumption | Consequence if it is wrong |
| --- | --- | --- |
| 1 | Majordome's Worker build can import an npm package installed from a git tag. | Vendor `dist/` into Majordome instead; the API does not change. |
| 2 | Headless Chromium's rendering is close enough to Apple Mail's WebKit to compare with the mockups. | F2.7 compares Chromium with Chromium only; Apple Mail is checked in F8.4. |
| 3 | Claude's vault mailbox can receive test sends and be read in Gmail web or by API. | F8.3 uses another mailbox Claude owns; recorded in `decisions/T7.md`. Outcome (T7, 27 Nov 2026): wrong, the vault mailbox (Cloudflare Email Routing) has no web client and no IMAP (`decisions/T7.md` D7); F8.3 to F8.5 move to T12, on the mailboxes of P3 and P4. |
| 4 | Classic Outlook is not installed in the Windows VM. | F8.5 relies on Outlook.com web plus the MSO rules of F4.2; open question 2 tracks it. |
| 5 | 60 KB leaves enough room under Gmail's 102 KB clip for 30 blocks. | Lower the block limit of section 4.2. |

## 12.3 Open questions

1. **Can the `mail-kit` repository be public on GitHub?** Default proposal: public. It
   holds no secret, only design code and the two themes' colours, which are already
   public on the tools' sites; consumers then install a tag with no token, in CI too.
   The other option: private, with a read-only token added to each consumer's CI
   secrets (one more secret per consumer). Answer: public, the default, approved by the owner on 27 Nov 2026.
2. **Is classic Outlook for Windows needed as a check?** Default proposal: no; Outlook.com
   web and the static MSO rules (F4.2) cover it, and a licence would cost money. If a
   client of the owner uses classic Outlook, a licence or a paid preview service (Litmus,
   Email on Acid) becomes a prerequisite. Answer: no, the default, approved by the owner on 27 Nov 2026.
