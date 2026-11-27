import { isAllowedUrl } from "../escape.js";
import { ContentError } from "../types.js";
const URL_SCHEMES = ["https:", "mailto:"];
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
        throw new ContentError(field, `${field} must be an absolute https: or mailto: URL`, blockIndex);
    }
}
function checkRichText(content, blockIndex) {
    if (isString(content))
        return;
    if (!Array.isArray(content)) {
        throw new ContentError("content", "content must be a string or an array", blockIndex);
    }
    for (const inline of content) {
        if (isString(inline))
            continue;
        if (typeof inline === "object" && inline !== null) {
            const item = inline;
            if (isString(item.bold))
                continue;
            if (isString(item.text) && "url" in item) {
                checkUrl(item.url, "content", blockIndex);
                continue;
            }
        }
        throw new ContentError("content", "an inline must be a string, { bold } or { text, url }", blockIndex);
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
        default:
            throw new ContentError("type", `unknown block type ${JSON.stringify(block.type)}`, index);
    }
}
/** The content rules of 04-data-model.md 4.2 and 4.3, F2.4 and section 8. */
export function checkContent(content) {
    checkText(content.subject, "subject", 1, 200);
    if (/[\r\n]/.test(content.subject)) {
        throw new ContentError("subject", "subject must not hold a line break");
    }
    if (content.preheader !== undefined)
        checkText(content.preheader, "preheader", 0, 140);
    if (content.footerReason !== undefined)
        checkText(content.footerReason, "footerReason", 0, 300);
    if (!Array.isArray(content.blocks) || content.blocks.length < 1 || content.blocks.length > 30) {
        throw new ContentError("blocks", "blocks must hold 1 to 30 blocks");
    }
    content.blocks.forEach((block, index) => {
        if (typeof block !== "object" || block === null) {
            throw new ContentError("type", "a block must be an object", index);
        }
        checkBlock(block, index);
    });
}
