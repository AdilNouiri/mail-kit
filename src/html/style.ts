import type { Theme } from "../types.ts";
import { cssValue, fallbackStack, MONO_STACK } from "./css.ts";

function fontFaces(theme: Theme): string {
  return theme.webFonts
    .map(
      (font) =>
        `@font-face{font-family:'${cssValue(font.family).replace(/'/g, "")}';src:url('${cssValue(font.url).replace(/'/g, "")}') format('woff2');font-weight:${font.weight}}`,
    )
    .join("");
}

/** Dark colours by selector, shared by the media query and Outlook.com's `[data-ogsc]` rules. */
function darkTextRules(theme: Theme, prefix: string): string {
  const d = theme.dark;
  const sel = (...classes: string[]) => classes.map((name) => `${prefix}${name}`).join(", ");
  return [
    `    ${sel(".mk-heading")} { color:${d.text} !important; }`,
    `    ${sel(".mk-text", ".mk-note")} { color:${d.textSoft} !important; }`,
    `    ${sel(".mk-code", ".mk-note")} { color:${d.text} !important; }`,
    `    ${sel(".mk-small", ".mk-footer")} { color:${d.muted} !important; }`,
    `    ${sel(".mk-small a", ".mk-link")} { color:${d.link} !important; }`,
    `    ${sel(".mk-footer a")} { color:${d.muted} !important; }`,
  ].join("\n");
}

/** The one `<style>` block: web fonts, the phone width and dark mode. */
export function styleBlock(theme: Theme): string {
  const d = theme.dark;
  return `<style>
  ${fontFaces(theme)}
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
    .mk-code, .mk-note, .mk-divider { background:${d.subtle} !important; }
${darkTextRules(theme, "")}
  }
${darkTextRules(theme, "[data-ogsc] ")}
</style>`;
}

/**
 * Outlook's Word engine shows Times New Roman when the first family of a stack is a web
 * font it cannot load, so Outlook alone gets the stacks without the web fonts.
 */
export function msoStyle(theme: Theme): string {
  const display = fallbackStack(theme, theme.fonts.display);
  const text = fallbackStack(theme, theme.fonts.text);
  return `<!--[if mso]><style>
  body, table, td, p, a, div, span, strong, center { font-family:${text} !important; }
  .mk-heading, .mk-wordmark { font-family:${display} !important; }
  .mk-code { font-family:${MONO_STACK} !important; }
</style><![endif]-->`;
}
