# mail-kit

One transactional email design for all the owner's tools, themed per tool. A tool passes
its theme (logo or wordmark, colours, fonts, footer) and a list of blocks; mail-kit hands
back a finished `subject`, `html` and `text`, ready for any sender (Resend, SMTP). It runs
in Cloudflare Workers and Node 22 or later, with no runtime dependency.

Status: under construction; the first tag is `v0.1.0`. Usage comes with that tag.

## Development

```sh
npm install
heavy npm run check
```

The specification is in [`spec/`](spec/README.md).
