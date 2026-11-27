/**
 * Emulations of the documented sanitizing of Gmail web and Outlook.com (F8.3, F8.5).
 * Every rule applied here is cited in spec/decisions/T12.md; a rule without a source is
 * not applied. These functions show what a client is documented to strip, never the
 * client's own behaviour.
 */

interface Rule {
  readonly prelude: string;
  readonly decls?: string;
  readonly children?: Rule[];
}

const GMAIL_DROPPED_PROPERTIES = new Set([
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "flex",
  "grid",
  "justify-content",
  "align-items",
  "gap",
  "background-attachment",
  "box-shadow",
  "color-scheme",
  "list-style-image",
  "transform",
  "transition",
]);

const GMAIL_STYLE_LIMIT = 16384;

function parseRules(css: string, pos = { i: 0 }): Rule[] {
  const rules: Rule[] = [];
  while (pos.i < css.length) {
    const open = css.indexOf("{", pos.i);
    const close = css.indexOf("}", pos.i);
    if (close !== -1 && (open === -1 || close < open)) {
      pos.i = close + 1;
      return rules;
    }
    if (open === -1) break;
    const prelude = css.slice(pos.i, open).trim();
    if (prelude.startsWith("@media") || prelude.startsWith("@supports")) {
      pos.i = open + 1;
      rules.push({ prelude, children: parseRules(css, pos) });
    } else {
      let end = open + 1;
      let depth = 1;
      while (end < css.length && depth > 0) {
        if (css[end] === "{") depth++;
        else if (css[end] === "}") depth--;
        end++;
      }
      rules.push({ prelude, decls: css.slice(open + 1, end - 1) });
      pos.i = end;
    }
  }
  return rules;
}

function serialize(rules: readonly Rule[]): string {
  return rules
    .map((r) =>
      r.children ? `${r.prelude}{${serialize(r.children)}}` : `${r.prelude}{${r.decls ?? ""}}`,
    )
    .join("\n");
}

function transformRules(rules: readonly Rule[], visit: (rule: Rule) => Rule | null): Rule[] {
  const out: Rule[] = [];
  for (const rule of rules) {
    const next = rule.children ? { ...rule, children: transformRules(rule.children, visit) } : rule;
    const kept = visit(next);
    if (kept && (!kept.children || kept.children.length > 0)) out.push(kept);
  }
  return out;
}

function splitDecls(decls: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < decls.length; i++) {
    const c = decls[i] as string;
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === ";" && depth === 0) {
      parts.push(decls.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(decls.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function propertyName(decl: string): string {
  return decl
    .slice(0, Math.max(decl.indexOf(":"), 0))
    .trim()
    .toLowerCase();
}

/** Gmail: properties off its list, custom properties and negative margins are removed. */
function gmailDeclarations(decls: string): string {
  return splitDecls(decls)
    .filter((decl) => {
      if (!decl.includes(":")) return false;
      const name = propertyName(decl);
      const value = decl.slice(decl.indexOf(":") + 1);
      if (GMAIL_DROPPED_PROPERTIES.has(name) || name.startsWith("--")) return false;
      if (/^(margin(-top|-right|-bottom|-left)?|text-indent)$/.test(name) && /-/.test(value)) {
        return false;
      }
      return true;
    })
    .join(";");
}

const DARK_QUERY = /prefers-color-scheme/i;

function mapStyleAttributes(html: string, fn: (decls: string) => string): string {
  return html.replace(/\sstyle="([^"]*)"/g, (_m, value: string) => ` style="${fn(value)}"`);
}

/** Selectors Gmail keeps: no pseudo-class but :hover, no attribute selector but [class~=]. */
function gmailSelectorKept(selector: string): boolean {
  const withoutClassAttr = selector.replace(/\[class~=[^\]]*\]/g, "");
  if (/\[[^\]]*\]/.test(withoutClassAttr)) return false;
  const pseudo = withoutClassAttr.match(/::?[a-zA-Z-]+/g) ?? [];
  return pseudo.every((p) => p === ":hover");
}

/** Variant A: Gmail web (Google account). */
export function emulateGmailWebA(html: string): string {
  let out = html.replace(/<link\b[^>]*>/gi, "");
  let styleLength = 0;
  out = out.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs: string, css: string) => {
    styleLength += css.length;
    if (styleLength > GMAIL_STYLE_LIMIT) return "";
    const cleaned = css.replace(/@import[^;]*;/gi, "");
    const rules = transformRules(parseRules(cleaned), (rule) => {
      if (rule.children) {
        return rule.prelude.startsWith("@media") && DARK_QUERY.test(rule.prelude) ? null : rule;
      }
      if (rule.prelude.startsWith("@font-face")) return null;
      const kept = rule.prelude
        .split(",")
        .map((s) => s.trim())
        .filter(gmailSelectorKept);
      if (kept.length === 0) return null;
      return { prelude: kept.join(", "), decls: gmailDeclarations(rule.decls ?? "") };
    });
    return `<style${attrs}>${serialize(rules)}</style>`;
  });
  return mapStyleAttributes(out, gmailDeclarations);
}

/** Variant B: Gmail with a non-Google account: no `<style>` block at all. */
export function emulateGmailWebB(html: string): string {
  const out = html.replace(/<link\b[^>]*>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  return mapStyleAttributes(out, gmailDeclarations);
}

/** Outlook.com web: classes prefixed `x_`, `@font-face` and `color-scheme` not applied. */
export function emulateOutlookCom(html: string): string {
  const dropColorScheme = (decls: string): string =>
    splitDecls(decls)
      .filter((d) => propertyName(d) !== "color-scheme")
      .join(";");
  let out = html.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (_m, attrs: string, css: string) => {
      const rules = transformRules(parseRules(css), (rule) => {
        if (rule.children) return rule;
        if (rule.prelude.startsWith("@font-face")) return null;
        return {
          prelude: rule.prelude.replace(/\.([A-Za-z_][\w-]*)/g, ".x_$1"),
          decls: dropColorScheme(rule.decls ?? ""),
        };
      });
      return `<style${attrs}>${serialize(rules)}</style>`;
    },
  );
  out = out.replace(/\sclass="([^"]*)"/g, (_m, value: string) => {
    const prefixed = value
      .split(/\s+/)
      .filter(Boolean)
      .map((c) => `x_${c}`)
      .join(" ");
    return ` class="${prefixed}"`;
  });
  return mapStyleAttributes(out, dropColorScheme);
}
