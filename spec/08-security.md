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
    F1.3).
  - Header injection through the subject: the subject is returned as is, but a CR or LF
    in it is a `ContentError`.
  - A consumer token in a URL leaking through the text part or logs: mail-kit logs
    nothing; tests use fictitious tokens.
  - Supply chain: no runtime dependency (F6.4); dev dependencies pinned with a lockfile.
