# 2. Vocabulary

| Term | Definition |
| --- | --- |
| consumer | A tool that imports mail-kit to build its mails (Majordome's app first). |
| theme | The values that make a mail look like one tool: wordmark, logo, colours, dark colours, fonts, button shape, language, footer. Type `Theme`. |
| built-in theme | A theme shipped in mail-kit under `src/themes/`, exported by name (`majordome`, `dream-studio`). |
| content | What one mail says: subject, preheader and blocks. Type `MailContent`. |
| block | One piece of a mail's body: `heading`, `paragraph`, `button`, `link`, `code`, `note` or `divider`. Type `Block`. |
| inline | A run of text inside a paragraph or a note: plain, bold or a link. Type `Inline`. |
| layout | The fixed frame around the blocks: canvas, banner, accent rule, card, footer. The same for every theme. |
| canvas | The full-width background behind the card. |
| banner | The top band of the card, in the theme's brand colour, holding the logo and the wordmark. |
| accent rule | The 4 px line in the accent colour under the banner. |
| card | The 600 px wide (maximum) area that holds the blocks. |
| footer | The small centred text under the card: why the recipient gets the mail, the legal line, an optional link. |
| preheader | The hidden line that mail clients show next to the subject in the inbox list. |
| fallback link | The small line under a button that repeats its address as text, for clients where the button fails. |
| rendered mail | What `renderMail` returns: `subject`, `html`, `text`. Type `RenderedMail`. |
| text part | The `text` of a rendered mail: the plain-text version sent beside the html. |
| sample mail | A content shipped for the preview and the tests: `magic-link`, `code`, `notice` (`src/samples.ts`). |
| preview gallery | The `preview/` folder the `preview` command writes: every theme with every sample mail, in html and PNG. |
| test send | A real send of a rendered mail, through Resend, to a mailbox Claude reads, to check a real client (F8). |
| tag | A git tag `v<major>.<minor>.<patch>` of the repository; consumers install mail-kit from a tag. |
