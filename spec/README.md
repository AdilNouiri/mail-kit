# mail-kit — specification

- **Status**: approved
- **Version**: 2026-11-27
- **Repository**: public GitHub repository `mail-kit` (open question 1)
- **Tracking**: https://app.notion.com/p/425f92e578b581b39803df7f9692760f

mail-kit gives every tool of the owner the same transactional email design. A tool passes
its theme (logo or wordmark, colours, fonts, footer) and a list of blocks; mail-kit hands
back a finished `subject`, `html` and `text`, ready for any sender (Resend, SMTP). This
folder is the single reference for every agent that builds it.

## Milestones

| Milestone | Goal | Features |
| --- | --- | --- |
| M1 | Majordome can import a tagged version and send its magic-link mail in the shared design, with its theme | F1, F2, F3, F4, F5, F6, F7 |
| M2 | Every mail is proven in real clients (Gmail web, Apple Mail, Outlook) by a test send, and the next tools can adopt it | F8 |

After M1, the Majordome app session is told (SendMessage) to adopt the tag. Adoption in
each consumer is that consumer's own change, made in its own session.

## Contents

1. [Vision and scope](01-vision-and-scope.md)
2. [Vocabulary](02-vocabulary.md)
3. [Features](03-features.md)
4. [Data model](04-data-model.md)
5. [Screens](05-screens.md)
6. [API](06-api.md)
7. [Architecture](07-architecture.md)
8. [Security](08-security.md)
9. [Tests](09-tests.md)
10. [Prerequisites](10-prerequisites.md)
11. [Tasks](11-tasks.md)
12. [Decisions](12-decisions.md)
