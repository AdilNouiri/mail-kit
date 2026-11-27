import { greet, VERSION } from "tiny-lib";
import { theme } from "tiny-lib/themes/a";
import { expect, it } from "vitest";

it("imports a file: package and its subpath export inside workerd", () => {
  expect(navigator.userAgent).toBe("Cloudflare-Workers");
  expect(VERSION).toBe("0.0.0");
  expect(greet(theme)).toBe("hello a");
});
