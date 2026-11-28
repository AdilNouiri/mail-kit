import { escapeHtml } from "../escape.js";
import { VERSION } from "../types.js";
import { renderBlock } from "./blocks/index.js";
import { checkContent } from "./check.js";
import { banner, footer, preheader } from "./layout.js";
import { msoStyle, styleBlock } from "./style.js";
/** The full html document of a mail; throws `ContentError` on content it cannot render. */
export function renderHtml(theme, content) {
    checkContent(content);
    const { colors } = theme;
    const body = content.blocks.map((block) => renderBlock(theme, block)).join("\n");
    return `<!doctype html>
<html lang="${theme.lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!-- mail-kit ${VERSION} -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(content.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
${styleBlock(theme)}
${msoStyle(theme)}
</head>
<body class="mk-body" style="margin:0;padding:0;background:${colors.canvas};">
${preheader(content.preheader)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mk-outer" bgcolor="${colors.canvas}" style="background:${colors.canvas};padding:32px 12px;">
<tr><td align="center">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
${banner(theme)}
<tr><td class="mk-card mk-pad" bgcolor="${colors.card}" style="background:${colors.card};padding:36px 40px 28px;border-radius:0 0 16px 16px;">
${body}
</td></tr>
${footer(theme, content.footerReason ?? theme.footer.reason)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>
`;
}
