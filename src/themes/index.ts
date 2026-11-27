import type { BuiltInThemeId, Theme } from "../types.ts";
import { dreamStudio } from "./dream-studio.ts";
import { majordome } from "./majordome.ts";

export { dreamStudio, majordome };

export const builtInThemes: Readonly<Record<BuiltInThemeId, Theme>> = Object.freeze({
  majordome,
  "dream-studio": dreamStudio,
});
