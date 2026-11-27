// Builds the mockup mails of spec/05-screens.md: the base layout with each theme.
// A prototype of the renderer, not its code: the tasks of spec/11-tasks.md rebuild it typed and tested.
// Run: node spec/images/src/build-mockups.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const themes = JSON.parse(
  (await import("node:fs")).readFileSync(join(here, "themes.json"), "utf8"),
);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function banner(t) {
  const logo = t.logo
    ? `<img src="${esc(t.logo.src)}" width="${t.logo.width}" height="${t.logo.height}" alt="" style="display:block;border:0;outline:none;width:${t.logo.width}px;height:${t.logo.height}px;">`
    : "";
  return `
<tr><td class="mk-banner" bgcolor="${t.colors.brand}" style="background:${t.colors.brand};padding:28px 40px;border-radius:16px 16px 0 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    ${logo ? `<td style="padding-right:12px;vertical-align:middle;">${logo}</td>` : ""}
    <td style="vertical-align:middle;font-family:${t.fonts.display};font-size:26px;line-height:30px;color:${t.colors.onBrand};letter-spacing:${t.wordmarkSpacing ?? "0"};">${esc(t.wordmark)}</td>
  </tr></table>
</td></tr>
<tr><td bgcolor="${t.colors.accent}" style="background:${t.colors.accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>`;
}

const blocks = {
  heading: (t, b) =>
    `<h1 class="mk-heading" style="margin:0 0 16px;font-family:${t.fonts.display};font-weight:${t.fonts.displayWeight};font-size:28px;line-height:34px;color:${t.colors.text};">${esc(b.text)}</h1>`,
  paragraph: (t, b) =>
    `<p class="mk-text" style="margin:0 0 16px;font-family:${t.fonts.text};font-size:16px;line-height:24px;color:${t.colors.textSoft};">${esc(b.text)}</p>`,
  button: (t, b) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
  <td bgcolor="${t.colors.accent}" style="background:${t.colors.accent};border-radius:${t.buttonRadius}px;">
    <a href="${esc(b.url)}" class="mk-button" style="display:inline-block;padding:14px 28px;font-family:${t.fonts.text};font-size:16px;line-height:20px;font-weight:600;color:${t.colors.onAccent};text-decoration:none;border-radius:${t.buttonRadius}px;">${esc(b.label)}</a>
  </td>
</tr></table>`,
  link: (t, b) =>
    `<p class="mk-small" style="margin:0 0 24px;font-family:${t.fonts.text};font-size:13px;line-height:20px;color:${t.colors.muted};">${esc(b.lead)}<br><a href="${esc(b.url)}" class="mk-link" style="color:${t.colors.link};word-break:break-all;">${esc(b.url)}</a></p>`,
  code: (t, b) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
  <td class="mk-code" align="center" bgcolor="${t.colors.subtle}" style="background:${t.colors.subtle};border-radius:12px;padding:18px 12px;font-family:'SFMono-Regular',Menlo,Consolas,'Courier New',monospace;font-size:30px;line-height:36px;letter-spacing:8px;font-weight:700;color:${t.colors.text};">${esc(b.code)}</td>
</tr></table>`,
  note: (t, b) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;"><tr>
  <td class="mk-note" bgcolor="${t.colors.subtle}" style="background:${t.colors.subtle};border-left:3px solid ${t.colors.accent};border-radius:0 8px 8px 0;padding:12px 16px;font-family:${t.fonts.text};font-size:14px;line-height:21px;color:${t.colors.textSoft};">${esc(b.text)}</td>
</tr></table>`,
};

function footer(t) {
  return `
<tr><td class="mk-footer" style="padding:24px 40px 8px;font-family:${t.fonts.text};font-size:12px;line-height:18px;color:${t.colors.footerText};text-align:center;">
  ${esc(t.footer.reason)}<br>
  ${esc(t.footer.legal)}${t.footer.link ? ` · <a href="${esc(t.footer.link.url)}" style="color:${t.colors.footerText};text-decoration:underline;">${esc(t.footer.link.label)}</a>` : ""}
</td></tr>`;
}

function render(t, mail) {
  const body = mail.blocks.map((b) => blocks[b.type](t, b)).join("\n");
  const d = t.dark;
  return `<!doctype html>
<html lang="${t.lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(mail.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  ${t.webFonts ?? ""}
  body { margin:0; padding:0; }
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  @media (max-width: 620px) {
    .mk-pad { padding-left:24px !important; padding-right:24px !important; }
    .mk-banner { padding:22px 24px !important; border-radius:0 !important; }
    .mk-card { border-radius:0 !important; }
    .mk-outer { padding:0 !important; }
  }
  @media (prefers-color-scheme: dark) {
    .mk-body, .mk-outer { background:${d.canvas} !important; }
    .mk-card { background:${d.card} !important; }
    .mk-heading { color:${d.text} !important; }
    .mk-text, .mk-note { color:${d.textSoft} !important; }
    .mk-code, .mk-note { background:${d.subtle} !important; color:${d.text} !important; }
    .mk-small, .mk-footer { color:${d.muted} !important; }
    .mk-small a { color:${d.link} !important; }
    .mk-footer a { color:${d.muted} !important; }
  }
</style>
</head>
<body class="mk-body" style="margin:0;padding:0;background:${t.colors.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(mail.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mk-outer" bgcolor="${t.colors.canvas}" style="background:${t.colors.canvas};padding:32px 12px;">
<tr><td align="center">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
${banner(t)}
<tr><td class="mk-card mk-pad" bgcolor="${t.colors.card}" style="background:${t.colors.card};padding:36px 40px 28px;border-radius:0 0 16px 16px;">
${body}
</td></tr>
${footer(t)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>
`;
}

const mails = {
  majordome: {
    name: "magic-link",
    subject: "Votre lien de connexion Majordome",
    preheader: "Valable 15 minutes, une seule fois.",
    blocks: [
      { type: "heading", text: "Votre lien de connexion" },
      { type: "paragraph", text: "Bonjour, touchez le bouton pour ouvrir votre espace Majordome." },
      { type: "button", label: "Me connecter", url: "https://app.example.com/auth/verify?token=EXAMPLE-TOKEN-1234" },
      { type: "link", lead: "Le bouton ne marche pas ? Copiez cette adresse dans votre navigateur :", url: "https://app.example.com/auth/verify?token=EXAMPLE-TOKEN-1234" },
      { type: "note", text: "Le lien est valable 15 minutes et ne sert qu'une fois. Vous n'avez rien demandé ? Ignorez cet e-mail, rien ne sera créé." },
    ],
  },
  second: {
    name: "code",
    subject: "Your sign-in code",
    preheader: "Your code expires in 10 minutes.",
    blocks: [
      { type: "heading", text: "Your sign-in code" },
      { type: "paragraph", text: "Enter this code on the sign-in page to continue." },
      { type: "code", code: "482 913" },
      { type: "note", text: "The code expires in 10 minutes. If you did not try to sign in, ignore this email." },
    ],
  },
};

const out = here;
mkdirSync(out, { recursive: true });
for (const t of themes) {
  const mail = mails[t.sample];
  const file = join(out, `05-${t.id}-${mail.name}.html`);
  writeFileSync(file, render(t, mail));
  console.log(file);
}
