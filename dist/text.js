import { labelled, stringsFor } from "./i18n.js";
const WIDTH = 76;
function wrap(line) {
    const words = line.split(/\s+/).filter((word) => word !== "");
    const lines = [];
    let current = "";
    for (const word of words) {
        if (current === "")
            current = word;
        else if (current.length + 1 + word.length <= WIDTH)
            current += ` ${word}`;
        else {
            lines.push(current);
            current = word;
        }
    }
    if (current !== "")
        lines.push(current);
    return lines;
}
function wrapText(text) {
    return text.split(/\r?\n/).flatMap(wrap);
}
function inlineText(part) {
    if (typeof part === "string")
        return part;
    if ("bold" in part)
        return part.bold;
    return `${part.text} (${part.url})`;
}
function richText(content) {
    return typeof content === "string" ? content : content.map(inlineText).join("");
}
function groupCode(code, group) {
    if (group <= 0)
        return code;
    const parts = [];
    for (let i = 0; i < code.length; i += group)
        parts.push(code.slice(i, i + group));
    return parts.join(" ");
}
function renderBlock(block, lang) {
    switch (block.type) {
        case "heading": {
            const title = block.text.replace(/\s+/g, " ").trim();
            return [title, "=".repeat(title.length)];
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
export function renderText(theme, content) {
    const link = theme.footer.link;
    const footer = [
        ...wrapText(content.footerReason ?? theme.footer.reason),
        ...wrapText(theme.footer.legal),
        ...(link ? wrap(labelled(theme.lang, link.label, link.url)) : []),
    ];
    const lines = [];
    for (const block of content.blocks)
        lines.push(...renderBlock(block, theme.lang), "");
    lines.push("--", ...footer);
    return `${lines.join("\n")}\n`;
}
