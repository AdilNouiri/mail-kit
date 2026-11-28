import { checkContent } from "./html/check.ts";
import { labelled, stringsFor } from "./i18n.ts";
import { assertDefinedTheme } from "./theme.ts";
import type { Block, Inline, Lang, MailContent, RichText, Theme } from "./types.ts";

const WIDTH = 76;

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

function graphemes(line: string): number {
  let count = 0;
  for (const _ of segmenter.segment(line)) count += 1;
  return count;
}

function wrap(line: string): string[] {
  const words = line.split(/[ \t\r\n]+/).filter((word) => word !== "");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current === "") current = word;
    else if (current.length + 1 + word.length <= WIDTH) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

function wrapText(text: string): string[] {
  return text.split(/\r?\n/).flatMap(wrap);
}

function inlineText(part: Inline): string {
  if (typeof part === "string") return part;
  if ("bold" in part) return part.bold;
  return `${part.text} (${part.url})`;
}

function richText(content: RichText): string {
  return typeof content === "string" ? content : content.map(inlineText).join("");
}

function groupCode(code: string, group: number): string {
  if (group <= 0) return code;
  const parts: string[] = [];
  for (let i = 0; i < code.length; i += group) parts.push(code.slice(i, i + group));
  return parts.join(" ");
}

function renderBlock(block: Block, lang: Lang): string[] {
  switch (block.type) {
    case "heading": {
      const lines = wrap(block.text);
      return [...lines, "=".repeat(Math.max(0, ...lines.map(graphemes)))];
    }
    case "paragraph":
    case "note":
      return wrapText(richText(block.content));
    case "button":
      return wrap(labelled(lang, block.label, block.url));
    case "link":
      return wrap(`${block.lead} ${block.url}`);
    case "code":
      return [labelled(lang, stringsFor(lang).codeLabel, groupCode(block.code, block.group ?? 0))];
    case "divider":
      return ["---"];
  }
}

/** F2.12: called alone, it runs the theme and content checks `renderMail` runs. */
export function renderText(theme: Theme, content: MailContent): string {
  assertDefinedTheme(theme);
  checkContent(content);
  return textPart(theme, content);
}

/** The text part of an already checked theme and content. */
export function textPart(theme: Theme, content: MailContent): string {
  const link = theme.footer.link;
  const footer = [
    ...wrapText(content.footerReason ?? theme.footer.reason),
    ...wrapText(theme.footer.legal),
    ...(link ? wrap(labelled(theme.lang, link.label, link.url)) : []),
  ];
  const lines: string[] = [];
  for (const block of content.blocks) lines.push(...renderBlock(block, theme.lang), "");
  lines.push("--", ...footer);
  return `${lines.join("\n")}\n`;
}
