export declare const VERSION = "0.1.2";
export type Lang = "fr" | "en";
/** `#rrggbb`, lower or upper case; checked by `defineTheme`. */
export type HexColor = string;
export type DisplayWeight = 400 | 600 | 700;
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export interface Logo {
    /** Absolute `https:` URL ending in `.png`, `.jpg` or `.jpeg`; the file is twice the display size. */
    readonly url: string;
    /** Display width in px, 16 to 200. */
    readonly width: number;
    /** Display height in px, 16 to 80. */
    readonly height: number;
}
export interface ThemeColors {
    readonly brand: HexColor;
    readonly onBrand: HexColor;
    readonly accent: HexColor;
    readonly onAccent: HexColor;
    readonly canvas: HexColor;
    readonly card: HexColor;
    readonly text: HexColor;
    readonly textSoft: HexColor;
    readonly muted: HexColor;
    readonly subtle: HexColor;
    readonly link: HexColor;
    readonly footerText: HexColor;
}
/** The roles that change under `prefers-color-scheme: dark`; brand, accent and their "on" colours stay. */
export interface ThemeDarkColors {
    readonly canvas: HexColor;
    readonly card: HexColor;
    readonly text: HexColor;
    readonly textSoft: HexColor;
    readonly muted: HexColor;
    readonly subtle: HexColor;
    readonly link: HexColor;
}
export interface ThemeFontsInput {
    /** Heading and wordmark stack, ending in a generic family. */
    readonly display: string;
    readonly displayWeight?: DisplayWeight;
    /** Body stack, ending in a generic family. */
    readonly text: string;
}
export interface ThemeFonts {
    readonly display: string;
    readonly displayWeight: DisplayWeight;
    readonly text: string;
}
export interface WebFont {
    readonly family: string;
    /** Absolute `https:` URL ending in `.woff2`. */
    readonly url: string;
    readonly weight: FontWeight;
}
export interface FooterLink {
    readonly label: string;
    /** Absolute `https:` URL. */
    readonly url: string;
}
export interface ThemeFooter {
    readonly reason: string;
    readonly legal: string;
    readonly link?: FooterLink;
}
/** What a consumer passes to `defineTheme`: optional fields get their defaults there. */
export interface ThemeInput {
    readonly id: string;
    readonly wordmark: string;
    readonly wordmarkSpacing?: number;
    readonly logo?: Logo;
    readonly lang?: Lang;
    readonly colors: ThemeColors;
    readonly dark: ThemeDarkColors;
    readonly fonts: ThemeFontsInput;
    readonly webFonts?: readonly WebFont[];
    readonly buttonRadius?: number;
    readonly footer: ThemeFooter;
}
declare const themeBrand: unique symbol;
/**
 * A validated, deeply frozen theme with every default filled in. Only `defineTheme` makes
 * one: the brand exists at the type level only, so a plain object is refused by the compiler.
 */
export interface Theme {
    readonly id: string;
    readonly wordmark: string;
    readonly wordmarkSpacing: number;
    readonly logo?: Logo;
    readonly lang: Lang;
    readonly colors: ThemeColors;
    readonly dark: ThemeDarkColors;
    readonly fonts: ThemeFonts;
    readonly webFonts: readonly WebFont[];
    readonly buttonRadius: number;
    readonly footer: ThemeFooter;
    readonly [themeBrand]: true;
}
export type BuiltInThemeId = "majordome" | "dream-studio";
export type Inline = string | {
    readonly bold: string;
} | {
    readonly text: string;
    /** As a button's `url`. */
    readonly url: string;
};
export type RichText = string | readonly Inline[];
export interface HeadingBlock {
    readonly type: "heading";
    readonly text: string;
}
export interface ParagraphBlock {
    readonly type: "paragraph";
    readonly content: RichText;
}
export interface ButtonBlock {
    readonly type: "button";
    readonly label: string;
    /**
     * `https:` or `mailto:`, or `http:` on the host `localhost`, `127.0.0.1` or `[::1]` for
     * local development, without userinfo (F2.9).
     */
    readonly url: string;
    /** Adds the fallback link under the button; default true. */
    readonly fallback?: boolean;
}
export interface LinkBlock {
    readonly type: "link";
    readonly lead: string;
    /** As a button's `url`. */
    readonly url: string;
}
export interface CodeBlock {
    readonly type: "code";
    /** 1 to 12 characters of `[A-Z0-9]`. */
    readonly code: string;
    /** Inserts a space every `group` characters for display only; 0 to 6, default 0. */
    readonly group?: number;
}
export interface NoteBlock {
    readonly type: "note";
    readonly content: RichText;
}
export interface DividerBlock {
    readonly type: "divider";
}
export type Block = HeadingBlock | ParagraphBlock | ButtonBlock | LinkBlock | CodeBlock | NoteBlock | DividerBlock;
export type BlockType = Block["type"];
export interface MailContent {
    readonly subject: string;
    readonly preheader?: string;
    readonly blocks: readonly Block[];
    readonly footerReason?: string;
}
export interface RenderedMail {
    readonly subject: string;
    readonly html: string;
    readonly text: string;
}
export type SampleName = "magic-link" | "code" | "notice";
export type Samples = Readonly<Record<SampleName, (lang: Lang) => MailContent>>;
/** A theme that `defineTheme` refuses. `path` is the dotted field path, such as `colors.accent`. */
export declare class ThemeError extends Error {
    readonly name = "ThemeError";
    readonly path: string;
    constructor(path: string, message: string);
}
/**
 * A content that cannot be rendered. `field` is the field name inside the block when
 * `blockIndex` is set (`url`), else the content's field (`subject`, `blocks`).
 */
export declare class ContentError extends Error {
    readonly name = "ContentError";
    readonly blockIndex?: number;
    readonly field: string;
    constructor(field: string, message: string, blockIndex?: number);
}
export {};
