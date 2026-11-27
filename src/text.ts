import type { Block, Inline, Lang, MailContent, RichText, Theme } from "./types.ts";

const WIDTH = 76;

// Stub until T1's src/i18n.ts lands (see spec/decisions/T3.md).
const LABELS: Readonly<Record<Lang, { readonly code: string; readonly colon: string }>> = {
  fr: { code: "Code", colon: " :" },
  en: { code: "Code", colon: ":" },
};

function wrap(line: string): string[] {
  const words = line.split(/\s+/).filter((word) => word !== "");
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
  const labels = LABELS[lang];
  switch (block.type) {
    case "heading": {
      const title = block.text.replace(/\s+/g, " ").trim();
      return [title, "=".repeat(title.length)];
    }
    case "paragraph":
    case "note":
      return wrapText(richText(block.content));
    case "button":
      return wrap(`${block.label}${labels.colon} ${block.url}`);
    case "link":
      return wrap(`${block.lead} ${block.url}`);
    case "code":
      return [`${labels.code}${labels.colon} ${groupCode(block.code, block.group ?? 0)}`];
    case "divider":
      return ["---"];
  }
}

export function renderText(theme: Theme, content: MailContent): string {
  const link = theme.footer.link;
  const footer = [
    ...wrapText(content.footerReason ?? theme.footer.reason),
    ...wrapText(theme.footer.legal),
    ...(link ? wrap(`${link.label}${LABELS[theme.lang].colon} ${link.url}`) : []),
  ];
  const lines: string[] = [];
  for (const block of content.blocks) lines.push(...renderBlock(block, theme.lang), "");
  lines.push("--", ...footer);
  return `${lines.join("\n")}\n`;
}
