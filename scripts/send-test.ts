import { pathToFileURL } from "node:url";
import { renderMail } from "../src/render-mail.ts";
import { samples } from "../src/samples.ts";
import { builtInThemes } from "../src/themes/index.ts";
import type { BuiltInThemeId, Lang, SampleName } from "../src/types.ts";

export const RESEND_URL = "https://api.resend.com/emails";

export interface SendTestInput {
  theme: string;
  sample: string;
  to: string;
  lang: string;
  allowAny: boolean;
}

export interface SendTestEnv {
  RESEND_API_KEY?: string | undefined;
  MAIL_KIT_TEST_FROM?: string | undefined;
  MAIL_KIT_TEST_MAILBOXES?: string | undefined;
}

export interface SendTestDeps {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
}

export interface SendTestResult {
  code: 0 | 1 | 2;
  stdout?: string;
  stderr?: string;
}

export function parseArgs(argv: readonly string[]): SendTestInput {
  const input: SendTestInput = { theme: "", sample: "", to: "", lang: "fr", allowAny: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--allow-any") input.allowAny = true;
    else if (arg === "--theme") input.theme = argv[++i] ?? "";
    else if (arg === "--sample") input.sample = argv[++i] ?? "";
    else if (arg === "--to") input.to = argv[++i] ?? "";
    else if (arg === "--lang") input.lang = argv[++i] ?? "";
  }
  return input;
}

export function allowedMailboxes(env: SendTestEnv): string[] {
  return (env.MAIL_KIT_TEST_MAILBOXES ?? "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
}

function retryAfterMs(value: string | null): number {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 120) * 1000 : 1000;
}

export async function sendTest(
  input: SendTestInput,
  env: SendTestEnv,
  deps: SendTestDeps,
): Promise<SendTestResult> {
  const missing: string[] = [];
  if (!env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!env.MAIL_KIT_TEST_FROM) missing.push("MAIL_KIT_TEST_FROM");
  if (!input.to) missing.push("--to");
  if (!input.theme) missing.push("--theme");
  if (!input.sample) missing.push("--sample");
  if (missing.length > 0) {
    return { code: 2, stderr: `send-test: missing ${missing.join(", ")}` };
  }
  if (!Object.hasOwn(builtInThemes, input.theme)) {
    return { code: 2, stderr: `send-test: unknown theme ${input.theme}` };
  }
  if (!Object.hasOwn(samples, input.sample)) {
    return { code: 2, stderr: `send-test: unknown sample ${input.sample}` };
  }
  if (input.lang !== "fr" && input.lang !== "en") {
    return { code: 2, stderr: "send-test: --lang must be fr or en" };
  }
  if (!input.allowAny && !allowedMailboxes(env).includes(input.to.toLowerCase())) {
    return {
      code: 2,
      stderr: `send-test: ${input.to} is not one of Claude's mailboxes (MAIL_KIT_TEST_MAILBOXES); pass --allow-any to send anyway`,
    };
  }

  const mail = renderMail(
    builtInThemes[input.theme as BuiltInThemeId],
    samples[input.sample as SampleName](input.lang as Lang),
  );
  const body = JSON.stringify({
    from: env.MAIL_KIT_TEST_FROM,
    to: [input.to],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  const post = () =>
    deps.fetch(RESEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body,
    });

  let response = await post();
  if (response.status === 429) {
    await deps.sleep(retryAfterMs(response.headers.get("retry-after")));
    response = await post();
  }
  if (!response.ok) {
    return { code: 1, stderr: `send-test: Resend answered ${response.status}` };
  }
  const { id } = (await response.json().catch(() => ({}))) as { id?: unknown };
  return {
    code: 0,
    stdout: `sent ${input.theme} ${input.sample} ${typeof id === "string" ? id : "(no id)"}`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await sendTest(parseArgs(process.argv.slice(2)), process.env, {
    fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  process.exit(result.code);
}
