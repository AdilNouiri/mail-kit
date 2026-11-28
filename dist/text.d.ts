import type { MailContent, Theme } from "./types.ts";
/** F2.12: called alone, it runs the theme and content checks `renderMail` runs. */
export declare function renderText(theme: Theme, content: MailContent): string;
/** The text part of an already checked theme and content. */
export declare function textPart(theme: Theme, content: MailContent): string;
