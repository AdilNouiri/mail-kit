# 10. Prerequisites

What only the owner can settle, or what needs the owner's sign-in. A missing prerequisite
blocks only the tasks that name it.

| ID | Prerequisite | Needed by | How the user settles it | Status |
| --- | --- | --- | --- | --- |
| P1 | Where the repository lives and who can read it (open question 1): public `mail-kit` repository on the owner's GitHub account, or private with a read token in each consumer's CI | T6 | Answer open question 1. Claude then creates the repository with `gh repo create` and tags releases itself. | done: public (27 Nov 2026) |
| P2 | A Resend API key with sending access only, for test sends from a domain verified in the owner's Resend account (`majordomeapp.fr`) | T7 | Nothing, unless the For you Chrome is signed out of Resend: Claude creates the key there and stores it as `RESEND_API_KEY_MAIL_KIT` with `vault capture`; the owner signs in only if asked by `cum for-you ready`. | missing |

Hand-offs that are not prerequisites (each done in its own session, started by Claude):

- Majordome serves `https://majordomeapp.fr/media/mail-logo.png` (the PNG of F7.3) and
  adopts the tag (Majordome app session, after M1).
- Claude's mailbox for test sends is read through `vault` (F8); no owner action.
- The `claude-memory` "New repository" checklist for `mail-kit` (repository list,
  routines, Merge closer, ruleset): Claude, once the repository exists.
