import type { Theme } from "../../types.ts";

export function renderDivider(theme: Theme): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
  <td class="mk-divider" bgcolor="${theme.colors.subtle}" style="background:${theme.colors.subtle};height:1px;line-height:1px;font-size:0;">&nbsp;</td>
</tr></table>`;
}
