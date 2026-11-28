# 8. Security

- **Authentication**: none; mail-kit is a library. The test-send command uses a Resend key
  from the environment (`vault run`).
- **Authorization**: none in mail-kit. Who may receive which mail is the consumer's check.
- **Personal data**: mail-kit sees the recipient's content only in memory while it renders,
  stores and logs nothing. Test sends go only to Claude's own mailboxes (F8, `--allow-any`
  needed otherwise); fixtures use `example.com` addresses.
- **Secrets**: `RESEND_API_KEY` only, a sending-only key created for mail-kit, stored in
  Claude's vault, never in the repository, a log or the command output.
- **Main threats**:
  - Html injection through content (a user's name in a paragraph): every text is escaped
    (F2.3); there is no "raw html" block.
  - A `javascript:` or `data:` link: only `https:` and `mailto:` URLs are accepted (F2.4,
    F1.3), plus loopback `http:` in content blocks (F2.9); `renderText` runs the same
    checks (F2.12).
  - A misleading address in a URL of any scheme: userinfo, a backslash, a bidi control or
    a zero-width character makes the visible fallback link print one host while the
    parser opens another, so all are refused (F2.10), for content and theme URLs alike.
  - A theme value ending a CSS declaration: font stacks and web font families refuse `&`
    and control characters, and `cssValue` strips `&`, so an entity like `&#59` cannot
    become `;` inside a `style` attribute (F1.7); a theme not made by `defineTheme` is
    refused at render time (F1.8).
  - A secret printed by mistake: `send-test` never echoes an option value (F8.7).
  - A loopback `http:` link (`localhost`, `127.0.0.1`, `[::1]`, F2.9): it opens only on
    the reader's own machine, so it cannot send the reader or a token to a third party,
    and `http:` there crosses no network. It exists for a consumer's local development
    (`wrangler dev`, e2e tests); in production a consumer builds links from its own
    `https:` origin. Phishing: the parsed host must equal one of the three, so a lookalike
    (`localhost.example.com`) is refused, and so is any userinfo
    (`http://localhost@evil.example`, `http://evil.example@localhost`), whose text before
    `@` misleads a reader. What remains is a GET to a service listening on the reader's
    machine, which any web page can already send; content comes from the consumer, never
    from a stranger. Theme URLs stay `https:` only (decision 13).
  - Header injection through the subject: the subject is returned as is, but a CR or LF
    in it is a `ContentError`.
  - A consumer token in a URL leaking through the text part or logs: mail-kit logs
    nothing; tests use fictitious tokens.
  - Supply chain: no runtime dependency (F6.4); dev dependencies pinned with a lockfile.
