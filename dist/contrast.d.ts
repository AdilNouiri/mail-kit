/** WCAG 2.x relative luminance of a `#rrggbb` colour. */
export declare function relativeLuminance(hex: string): number;
/** WCAG contrast ratio of two `#rrggbb` colours, from 1 to 21, in either order. */
export declare function contrastRatio(first: string, second: string): number;
export declare const MIN_CONTRAST = 4.5;
