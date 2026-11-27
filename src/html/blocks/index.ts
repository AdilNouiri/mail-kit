import type { Block, Theme } from "../../types.ts";
import { renderButton } from "./button.ts";
import { renderCode } from "./code.ts";
import { renderDivider } from "./divider.ts";
import { renderHeading } from "./heading.ts";
import { renderLink } from "./link.ts";
import { renderNote } from "./note.ts";
import { renderParagraph } from "./paragraph.ts";

export function renderBlock(theme: Theme, block: Block): string {
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
