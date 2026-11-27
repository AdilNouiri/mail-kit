import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { release } from "../../scripts/release.ts";

// Builds the package like a dry-run release, packs it, and installs the tarball into the
// fixture folder: the fixtures test what a consumer gets, never `src/`.
export function installPacked(fixture: "worker" | "node"): void {
  const packDir = mkdtempSync(join(tmpdir(), "mail-kit-pack-"));
  let cleanup = () => {};
  try {
    const result = release({ dryRun: true, packDir, fromWorkingTree: true });
    cleanup = result.cleanup;
    if (!result.tarball) throw new Error("no tarball");
    execFileSync(
      "npm",
      [
        "install",
        "--prefix",
        fileURLToPath(new URL(`./${fixture}`, import.meta.url)),
        "--no-package-lock",
        "--no-save",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        result.tarball,
      ],
      { stdio: "inherit" },
    );
  } finally {
    cleanup();
    rmSync(packDir, { recursive: true, force: true });
  }
}

const fixture = process.argv[2];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (fixture !== "worker" && fixture !== "node") {
    console.error("usage: node test/consumers/prepare.ts <worker|node>");
    process.exit(2);
  }
  installPacked(fixture);
}
