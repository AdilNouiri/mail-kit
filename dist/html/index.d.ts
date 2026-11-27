import { type MailContent, type Theme } from "../types.ts";
/** The full html document of a mail; throws `ContentError` on content it cannot render. */
export declare function renderHtml(theme: Theme, content: MailContent): string;
