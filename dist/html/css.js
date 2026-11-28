/**
 * Makes a free-text theme value (a font stack, a family, a font URL) safe inside a CSS
 * declaration, whether in a `style` attribute or the `<style>` block: it cannot end the
 * declaration, the rule, the attribute or the element. `&` goes too: inside a `style`
 * attribute the html parser decodes an entity such as `&#59` to `;` before CSS reads it (F1.7).
 */
export function cssValue(value) {
    return value.replace(/"/g, "'").replace(/[<>{};\\&]/g, "");
}
function familyName(entry) {
    return entry
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .toLowerCase();
}
/**
 * The stack without the theme's web font families: what a client without web fonts uses.
 * Never empty: a stack of web fonts only keeps its last entry, the generic family.
 */
export function fallbackStack(theme, stack) {
    const webFamilies = new Set(theme.webFonts.map((font) => familyName(font.family)));
    const entries = stack
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry !== "");
    const kept = entries.filter((entry) => !webFamilies.has(familyName(entry)));
    const chosen = kept.length > 0 ? kept : entries.slice(-1);
    return cssValue(chosen.length > 0 ? chosen.join(", ") : "sans-serif");
}
export const MONO_STACK = "'SFMono-Regular',Menlo,Consolas,'Courier New',monospace";
