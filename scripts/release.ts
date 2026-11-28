import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tscBin = join(root, "node_modules", ".bin", "tsc");

// tsconfig.json is the no-emit development config (decisions/T0.md D4, D5): the release
// build compiles src/ alone, without Node types; `webworker` is only there for the `URL` type,
// which Workers and Node both provide (decisions/T6.md).
export const BUILD_OPTIONS = [
  "--ignoreConfig",
  "--target",
  "es2022",
  "--lib",
  "es2022,webworker",
  "--types",
  "",
  "--module",
  "nodenext",
  "--moduleResolution",
  "nodenext",
  "--strict",
  "--noUncheckedIndexedAccess",
  "--isolatedModules",
  "--verbatimModuleSyntax",
  "--erasableSyntaxOnly",
  "--allowImportingTsExtensions",
  "--rewriteRelativeImportExtensions",
  "--declaration",
  "--skipLibCheck",
  "--rootDir",
  "src",
  "--outDir",
  "dist",
];

export interface ReleaseOptions {
  dryRun: boolean;
  packDir?: string;
  fromWorkingTree?: boolean;
}

export interface ReleaseResult {
  version: string;
  tag: string;
  cloneDir: string;
  releaseCommit: string;
  tarball: string | undefined;
  cleanup: () => void;
}

function run(cmd: string, args: string[], cwd: string): string {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function git(cwd: string, ...args: string[]): string {
  return run("git", args, cwd);
}

export function assertChangelog(changelog: string, version: string): void {
  const heading = new RegExp(`^## ${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  if (!heading.test(changelog)) throw new Error(`CHANGELOG.md has no "## ${version}" section`);
}

export function releaserIdentity(repo: string): Record<string, string> {
  const read = (key: string) => {
    try {
      return git(repo, "config", key);
    } catch {
      return "";
    }
  };
  const name = read("user.name");
  const email = read("user.email");
  if (!name || !email) throw new Error("git has no user.name and user.email: set your identity");
  return {
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
  };
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (path.endsWith(".ts")) out.push(path);
  }
  return out.sort();
}

function overlayWorkingTree(repo: string, cloneDir: string): void {
  const list = (...args: string[]) =>
    git(repo, "ls-files", "-z", ...args)
      .split("\0")
      .filter(Boolean);
  const present = list("-co", "--exclude-standard");
  const deleted = new Set(list("-d"));
  for (const file of present) {
    if (deleted.has(file)) {
      rmSync(join(cloneDir, file), { force: true });
    } else {
      mkdirSync(dirname(join(cloneDir, file)), { recursive: true });
      cpSync(join(repo, file), join(cloneDir, file));
    }
  }
}

export function release(options: ReleaseOptions): ReleaseResult {
  const repo = git(root, "rev-parse", "--show-toplevel");
  const originUrl = git(repo, "remote", "get-url", "origin");
  if (!options.dryRun) {
    const branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD");
    if (branch !== "main") throw new Error(`a real release runs on main, not ${branch}`);
    if (git(repo, "status", "--porcelain")) throw new Error("the working tree is not clean");
    git(repo, "fetch", "--quiet", originUrl, "main");
    if (git(repo, "rev-parse", "HEAD") !== git(repo, "rev-parse", "FETCH_HEAD")) {
      throw new Error("local main differs from origin/main");
    }
  }

  const work = mkdtempSync(join(tmpdir(), "mail-kit-release-"));
  const cloneDir = join(work, "clone");
  const cleanup = () => rmSync(work, { recursive: true, force: true });
  try {
    git(work, "clone", "--quiet", "--no-hardlinks", repo, cloneDir);
    git(cloneDir, "checkout", "--quiet", "--detach", git(repo, "rev-parse", "HEAD"));
    if (options.dryRun) {
      git(cloneDir, "config", "user.name", "mail-kit release");
      git(cloneDir, "config", "user.email", "release@example.com");
    }
    if (options.fromWorkingTree && options.dryRun) overlayWorkingTree(repo, cloneDir);

    const pkg = JSON.parse(readFileSync(join(cloneDir, "package.json"), "utf8")) as {
      version: string;
    };
    const version = pkg.version;
    const tag = `v${version}`;
    const types = readFileSync(join(cloneDir, "src", "types.ts"), "utf8");
    if (!types.includes(`export const VERSION = "${version}";`)) {
      throw new Error(`VERSION in src/types.ts does not match package.json ${version}`);
    }
    assertChangelog(readFileSync(join(cloneDir, "CHANGELOG.md"), "utf8"), version);
    const identity = options.dryRun ? {} : releaserIdentity(repo);
    if (!options.dryRun) {
      if (git(repo, "tag", "--list", tag) || git(repo, "ls-remote", "--tags", originUrl, tag)) {
        throw new Error(`tag ${tag} already exists`);
      }
    }

    const sources = sourceFiles(join(cloneDir, "src")).map((f) => relative(cloneDir, f));
    run(tscBin, [...BUILD_OPTIONS, ...sources], cloneDir);
    git(cloneDir, "add", "--force", "dist");
    execFileSync("git", ["commit", "--quiet", "-m", `release: ${tag}`], {
      cwd: cloneDir,
      env: { ...process.env, ...identity },
      stdio: "pipe",
    });
    const releaseCommit = git(cloneDir, "rev-parse", "HEAD");
    git(cloneDir, "tag", tag, releaseCommit);

    let tarball: string | undefined;
    if (options.packDir) {
      const dest = resolve(options.packDir);
      mkdirSync(dest, { recursive: true });
      const out = run(
        "npm",
        ["pack", "--ignore-scripts", "--pack-destination", dest, "--silent"],
        cloneDir,
      );
      tarball = join(dest, out.split("\n").pop() ?? "");
    }

    if (!options.dryRun) git(cloneDir, "push", originUrl, `refs/tags/${tag}`);
    return { version, tag, cloneDir, releaseCommit, tarball, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}

function main(argv: string[]): number {
  const dryRun = argv.includes("--dry-run");
  const packIndex = argv.indexOf("--pack");
  const packDir = packIndex >= 0 ? argv[packIndex + 1] : undefined;
  if (packIndex >= 0 && !packDir) {
    console.error("usage: node scripts/release.ts [--dry-run] [--pack <dir>]");
    return 2;
  }
  try {
    const result = release({ dryRun, ...(packDir ? { packDir } : {}) });
    result.cleanup();
    const prefix = dryRun ? "dry run, nothing pushed: " : "pushed ";
    const pack = result.tarball ? `, tarball ${result.tarball}` : "";
    console.log(`${prefix}${result.tag} at ${result.releaseCommit.slice(0, 7)}${pack}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
