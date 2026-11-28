import { isAllowedUrl } from "../escape.js";
import { ContentError } from "../types.js";
const URL_SCHEMES = ["https:", "mailto:", "http:loopback"];
const CODE_PATTERN = /^[A-Z0-9]{1,12}$/;
function length(text) {
    return [...text].length;
}
function isString(value) {
    return typeof value === "string";
}
function checkText(value, field, min, max, blockIndex) {
    if (!isString(value))
        throw new ContentError(field, `${field} must be a string`, blockIndex);
    const size = length(value);
    if (size < min || size > max) {
        throw new ContentError(field, `${field} must be ${min} to ${max} characters long, got ${size}`, blockIndex);
    }
}
function checkUrl(value, field, blockIndex) {
    if (!isString(value) || !isAllowedUrl(value, URL_SCHEMES)) {
        throw new ContentError(field, `${field} must be an absolute https: or mailto: URL, or an http: URL on localhost, 127.0.0.1 or [::1]`, blockIndex);
    }
}
/** The words the reader sees, once the inlines are known to be well formed. */
function inlineWords(inline) {
    if (isString(inline))
        return inline;
    const item = inline;
    return "bold" in item ? item.bold : item.text;
}
function checkRichText(content, blockIndex) {
    if (isString(content)) {
        checkVisible(content, blockIndex);
        return;
    }
    if (!Array.isArray(content)) {
        throw new ContentError("content", "content must be a string or an array", blockIndex);
    }
    for (let index = 0; index < content.length; index++) {
        const inline = content[index];
        if (isString(inline))
            continue;
        if (typeof inline === "object" && inline !== null) {
            const item = inline;
            // The renderers test `"bold" in inline` first, so a non-string bold must stop here.
            if ("bold" in item) {
                if (isString(item.bold))
                    continue;
                throw new ContentError("content", "an inline's bold must be a string", blockIndex);
            }
            if (isString(item.text) && "url" in item) {
                checkUrl(item.url, "content", blockIndex);
                continue;
            }
        }
        throw new ContentError("content", "an inline must be a string, { bold } or { text, url }", blockIndex);
    }
    checkVisible(content.map(inlineWords).join(""), blockIndex);
}
/** Whitespace, format characters (U+200B, U+2060...) and other characters that draw nothing. */
const INVISIBLE_ONLY = /^[\s\p{Cf}\p{Default_Ignorable_Code_Point}]*$/u;
function checkVisible(text, blockIndex) {
    if (INVISIBLE_ONLY.test(text)) {
        throw new ContentError("content", "content must not be empty or blank", blockIndex);
    }
}
function checkBlock(block, index) {
    switch (block.type) {
        case "heading":
            checkText(block.text, "text", 1, 120, index);
            return;
        case "paragraph":
        case "note":
            checkRichText(block.content, index);
            return;
        case "button":
            checkText(block.label, "label", 1, 40, index);
            checkUrl(block.url, "url", index);
            if (block.fallback !== undefined && typeof block.fallback !== "boolean") {
                throw new ContentError("fallback", "fallback must be a boolean", index);
            }
            return;
        case "link":
            if (!isString(block.lead))
                throw new ContentError("lead", "lead must be a string", index);
            checkUrl(block.url, "url", index);
            return;
        case "code": {
            if (!isString(block.code) || !CODE_PATTERN.test(block.code)) {
                throw new ContentError("code", "code must be 1 to 12 characters of A-Z and 0-9", index);
            }
            const group = block.group ?? 0;
            if (!Number.isInteger(group) || group < 0 || group > 6) {
                throw new ContentError("group", "group must be an integer from 0 to 6", index);
            }
            return;
        }
        case "divider":
            return;
        default: {
            // JSON.stringify throws on a BigInt or a circular value, so only a string is quoted.
            const type = block.type;
            const shown = typeof type === "string" ? JSON.stringify(type) : `of type ${typeof type}`;
            throw new ContentError("type", `unknown block type ${shown}`, index);
        }
    }
}
/** The content rules of 04-data-model.md 4.2 and 4.3, F2.4 and section 8. */
export function checkContent(content) {
    if (typeof content !== "object" || content === null) {
        throw new ContentError("content", "the mail content must be an object");
    }
    checkText(content.subject, "subject", 1, 200);
    if (/[\r\n]/.test(content.subject)) {
        throw new ContentError("subject", "subject must not hold a line break");
    }
    if (content.preheader !== undefined)
        checkText(content.preheader, "preheader", 0, 140);
    if (content.footerReason !== undefined)
        checkText(content.footerReason, "footerReason", 1, 300);
    if (!Array.isArray(content.blocks) || content.blocks.length < 1 || content.blocks.length > 30) {
        throw new ContentError("blocks", "blocks must hold 1 to 30 blocks");
    }
    // By index, not forEach: forEach skips the holes of a sparse array.
    for (let index = 0; index < content.blocks.length; index++) {
        const block = content.blocks[index];
        if (typeof block !== "object" || block === null) {
            throw new ContentError("type", "a block must be an object", index);
        }
        checkBlock(block, index);
    }
}
