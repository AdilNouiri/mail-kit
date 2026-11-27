import { renderButton } from "./button.js";
import { renderCode } from "./code.js";
import { renderDivider } from "./divider.js";
import { renderHeading } from "./heading.js";
import { renderLink } from "./link.js";
import { renderNote } from "./note.js";
import { renderParagraph } from "./paragraph.js";
export function renderBlock(theme, block) {
    switch (block.type) {
        case "heading":
            return renderHeading(theme, block);
        case "paragraph":
            return renderParagraph(theme, block);
        case "button":
            return renderButton(theme, block);
        case "link":
            return renderLink(theme, block);
        case "code":
            return renderCode(theme, block);
        case "note":
            return renderNote(theme, block);
        case "divider":
            return renderDivider(theme);
    }
}
