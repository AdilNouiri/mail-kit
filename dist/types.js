export const VERSION = "0.1.1";
/** A theme that `defineTheme` refuses. `path` is the dotted field path, such as `colors.accent`. */
export class ThemeError extends Error {
    name = "ThemeError";
    path;
    constructor(path, message) {
        super(message);
        this.path = path;
    }
}
/**
 * A content that cannot be rendered. `field` is the field name inside the block when
 * `blockIndex` is set (`url`), else the content's field (`subject`, `blocks`).
 */
export class ContentError extends Error {
    name = "ContentError";
    field;
    constructor(field, message, blockIndex) {
        super(message);
        this.field = field;
        if (blockIndex !== undefined)
            this.blockIndex = blockIndex;
    }
}
