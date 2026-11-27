import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { type ReleaseResult, release } from "../../../scripts/release.ts";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
  dependencies?: Record<string, string>;
  scripts: Record<string, string>;
};

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let result: ReleaseResult;
let consumer: string;

before(() => {
  result = release({ dryRun: true });
  consumer = mkdtempSync(join(tmpdir(), "mail-kit-consumer-"));
});

after(() => {
  result.cleanup();
  rmSync(consumer, { recursive: true, force: true });
});

test("F6.1: dist/ exists only on the tagged commit, never on a branch, and the tag installs from git without an install script", () => {
  assert.equal(result.tag, `v${pkg.version}`);
  const tagged = git(result.cloneDir, "ls-tree", "-r", "--name-only", result.tag).split("\n");
  assert.ok(tagged.some((f) => f === "dist/index.js"));
  assert.ok(tagged.some((f) => f === "dist/index.d.ts"));
  assert.equal(git(result.cloneDir, "rev-parse", `${result.tag}^{commit}`), result.releaseCommit);
  const parent = git(result.cloneDir, "ls-tree", "-r", "--name-only", `${result.tag}~1`);
  assert.equal(parent.split("\n").filter((f) => f.startsWith("dist/")).length, 0);
  const branches = git(result.cloneDir, "branch", "--all", "--contains", result.tag);
  assert.ok(!/\bmain\b/.test(branches), `tag reachable from a branch: ${branches}`);

  for (const hook of ["preinstall", "install", "postinstall", "prepare"]) {
    assert.equal(pkg.scripts[hook], undefined, `${hook} script present`);
  }
  execFileSync(
    "npm",
    [
      "install",
      "--prefix",
      consumer,
      "--no-package-lock",
      "--no-audit",
      "--no-fund",
      `git+file://${result.cloneDir}#${result.tag}`,
    ],
    { stdio: "pipe" },
  );
  const files = walk(join(consumer, "node_modules", "mail-kit", "dist"));
  assert.ok(files.some((f) => f.endsWith(".js")));
  assert.ok(files.some((f) => f.endsWith(".d.ts")));
});

test("F6.4: no runtime dependency, and dist imports nothing outside itself", () => {
  assert.deepEqual(pkg.dependencies ?? {}, {});
  const dist = join(consumer, "node_modules", "mail-kit", "dist");
  const imports = /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["']([^"']+)["']/g;
  for (const file of walk(dist).filter((f) => f.endsWith(".js") || f.endsWith(".d.ts"))) {
    for (const m of readFileSync(file, "utf8").matchAll(imports)) {
      assert.ok(m[1]?.startsWith("."), `${file} imports ${m[1]}`);
    }
  }
});

test("F6.5: the version comment of a rendered mail matches package.json", async () => {
  const { renderMail } = await import(
    join(consumer, "node_modules", "mail-kit", "dist", "index.js")
  );
  const { majordome } = await import(
    join(consumer, "node_modules", "mail-kit", "dist", "themes", "majordome.js")
  );
  const { subject, html } = renderMail(majordome, {
    subject: "Sujet",
    blocks: [{ type: "paragraph", content: "Bonjour" }],
  });
  assert.equal(subject, "Sujet");
  assert.deepEqual(html.match(/<!-- mail-kit [^>]*-->/g), [`<!-- mail-kit ${pkg.version} -->`]);
});

test("a dry run creates no tag and no dist in the repository", () => {
  assert.equal(git(root, "tag", "--list", result.tag), "");
  assert.equal(existsSync(join(root, "dist")), false);
});
