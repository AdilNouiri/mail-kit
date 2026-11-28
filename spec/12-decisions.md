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
    fallback, which the emulated Gmail check of F8.3 shows.
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
14. **Client checks without mailboxes: Gmail and Outlook.com emulated, Apple Mail through
    its Quick Look renderer, else WebKit (28 Nov 2026).** Claude cannot make the mailboxes of P3 and
    P4: Microsoft's sign-up answers error code 1220 on `CheckAvailableSigninNames` for
    every name from the automated For you Chrome (its HUMAN/PerimeterX bot protection),
    and Google requires a phone check. The owner said on 28 Nov 2026 never to be asked to
    create them, so P3 and P4 are dropped. F8.3 and F8.5 become emulated: each client's
    documented sanitizing (cited per rule in `decisions/T12.md`) is applied to the
    rendered html and shown in the headless test Chrome. That proves the layout survives
    what the client is known to strip, notably the light layout without the `<style>`
    block that F4 already requires, but not the client's undocumented behaviour, so an
    emulated criterion is never reported as passed in the real client. F8.4 keeps a real
    renderer: Apple Mail's Quick Look extension (`com.apple.mail.MailQuickLookExtension`,
    listed by `pluginkit -m -A -p com.apple.quicklook.preview` on the Mac, 28 Nov 2026)
    shows an `.eml` with Mail's message view and no account; whether it renders inside
    the sandbox guest, and in dark appearance, is unverified until T12. Rejected: the Mail
    app with no account (its "Add Account" wizard blocks, `decisions/T7.md` D7); Mail with
    a local IMAP server in the guest (the account needs the wizard or a configuration
    profile approved by hand); paid previews (Litmus, Email on Acid: money beyond the
    spec, open question 2); another free webmail (it proves neither Gmail nor
    Outlook.com); asking the owner for the accounts (refused by the owner).
    Outcome (T12, 28 Nov 2026): in the guest the extension opened no window for the `.eml`
    files, in light or dark (`decisions/T12.md` D4), so F8.4 used the spec's fallback and
    is emulated too, with Playwright's WebKit; no client of F8 is a real renderer check.
    The Quick Look recipe stays to retry on a later guest.
15. **The final review's points are applied in full (28 Nov 2026), shipped as `0.1.2`.**
    The project's final review (verdict mergeable, 12 non-blocking points) is applied by
    T13 to T16. Choices made for the points the spec left open:
    - Size (point 3): 60 KB holds for the samples only (F4.5); limiting each field cannot
      bound 30 blocks, so `renderMail` refuses html over 100,000 bytes in UTF-8 (F4.8),
      below Gmail's 102 KB clip. Rejected: per-field length limits alone (30 buttons with
      2,000-character URLs still pass 280 KB).
    - Link in a note (point 1): it takes the note's own text colour, underlined (F4.9),
      since that colour on `subtle` is already checked; no theme colour or mockup changes.
      Rejected: a new `link` on `subtle` pair (Majordome's `dark.link` would fail at
      4.11:1 and its colour and dark mockups would change).
    - Hardening (points 5, 6, 7, 12): misleading URLs refused for every scheme (F2.10), CSS
      values that could end a declaration refused (F1.7), malformed content and an empty
      `footerReason` refused with a `ContentError` (F2.11), `renderText` checked (F2.12),
      a theme not made by `defineTheme` refused at render time (F1.8). A consumer's
      content is trusted, but a consumer may put user-influenced text in it.
    - Text part (point 8): headings wrap like other lines and are underlined to their
      longest line in grapheme clusters (F3.3, F3.5); only ASCII whitespace breaks a line,
      so a consumer's no-break space survives.
    - Release identity (point 10): the real release uses the releaser's own git identity
      (the kit's rule: Claude never sets `user.name` or `user.email`); the dry run keeps a
      stand-in in its temporary clone. The release refuses a version with no changelog
      section (F6.6).
    - `send-test` (point 9): no option value is echoed (F8.7), as `decisions/T7.md`
      review 2 intended.

## 12.2 Assumptions

| # | Assumption | Consequence if it is wrong |
| --- | --- | --- |
| 1 | Majordome's Worker build can import an npm package installed from a git tag. | Vendor `dist/` into Majordome instead; the API does not change. |
| 2 | Headless Chromium's rendering is close enough to Apple Mail's WebKit to compare with the mockups. | F2.7 compares Chromium with Chromium only; Apple Mail is checked in F8.4 (emulated with WebKit, decision 14). |
| 3 | Claude's vault mailbox can receive test sends and be read in Gmail web or by API. | F8.3 uses another mailbox Claude owns; recorded in `decisions/T7.md`. Outcome (T7, 27 Nov 2026): wrong, the vault mailbox (Cloudflare Email Routing) has no web client and no IMAP (`decisions/T7.md` D7); F8.3 to F8.5 move to T12, on the mailboxes of P3 and P4. Outcome (28 Nov 2026): P3 and P4 cannot be made either and are dropped; T12 checks without a mailbox: Gmail, Outlook.com and, since Quick Look did not render in the guest, Apple Mail (WebKit) are all emulated (decision 14). |
| 4 | Classic Outlook is not installed in the Windows VM. | F8.5 relies on Outlook.com web plus the MSO rules of F4.2; open question 2 tracks it. |
| 5 | 60 KB leaves enough room under Gmail's 102 KB clip for 30 blocks. | Lower the block limit of section 4.2. Outcome (final review, 28 Nov 2026): wrong, 30 buttons with 228-character URLs give 71,658 bytes and with 2,000-character URLs 286,458 bytes; 60 KB holds for the samples only (F4.5), and `renderMail` refuses html over 100,000 bytes (F4.8, decision 15). |

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
