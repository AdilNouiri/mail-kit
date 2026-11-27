import { describe, expect, it } from "vitest";
import { parseArgs, sendTest } from "../scripts/send-test.ts";

const KEY = "re_EXAMPLE_KEY_1234";
const env = {
  RESEND_API_KEY: KEY,
  MAIL_KIT_TEST_FROM: "test@example.com",
  MAIL_KIT_TEST_MAILBOXES: "Claude@example.com, other@example.com",
};
const args = ["--theme", "majordome", "--sample", "magic-link", "--to", "claude@example.com"];

interface Call {
  url: string;
  init: RequestInit;
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

function deps(answers: Response[]) {
  const calls: Call[] = [];
  const sleeps: number[] = [];
  const fetchStub = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = answers.shift();
    if (!next) throw new Error("unexpected extra request");
    return next;
  }) as unknown as typeof fetch;
  return {
    calls,
    sleeps,
    deps: { fetch: fetchStub, sleep: async (ms: number) => void sleeps.push(ms) },
  };
}

describe("F8.1 one command per pair", () => {
  it("posts the rendered mail to Resend and prints the message id, never the key", async () => {
    const d = deps([json(200, { id: "msg_123" })]);
    const result = await sendTest(parseArgs(args), env, d.deps);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("msg_123");
    expect(`${result.stdout}${result.stderr}`).not.toContain(KEY);
    expect(d.calls).toHaveLength(1);
    const call = d.calls[0] as Call;
    expect(call.url).toBe("https://api.resend.com/emails");
    expect((call.init.headers as Record<string, string>).authorization).toBe(`Bearer ${KEY}`);
    const sent = JSON.parse(call.init.body as string);
    expect(sent.to).toEqual(["claude@example.com"]);
    expect(sent.from).toBe("test@example.com");
    expect(sent.html).toContain("<html");
    expect(sent.text.length).toBeGreaterThan(0);
    expect(sent.subject).toBe("Votre lien de connexion Majordome");
  });

  it("exits 1 with the status only on a non-2xx answer, key not printed", async () => {
    const d = deps([json(403, { message: `bad key ${KEY}` })]);
    const result = await sendTest(parseArgs(args), env, d.deps);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("403");
    expect(result.stderr).not.toContain(KEY);
    expect(result.stderr).not.toContain("bad key");
  });
});

describe("F8.2 refuses without a key or an address", () => {
  it.each([
    ["RESEND_API_KEY", { ...env, RESEND_API_KEY: undefined }, args],
    ["MAIL_KIT_TEST_FROM", { ...env, MAIL_KIT_TEST_FROM: undefined }, args],
    ["--to", env, ["--theme", "majordome", "--sample", "code"]],
  ])("exits 2 naming %s and sends nothing", async (name, e, a) => {
    const d = deps([]);
    const result = await sendTest(parseArgs(a), e, d.deps);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain(name);
    expect(d.calls).toHaveLength(0);
  });

  it("exits 2 on an unknown theme or sample", async () => {
    const d = deps([]);
    const a = await sendTest(
      parseArgs(["--theme", "nope", "--sample", "code", "--to", "claude@example.com"]),
      env,
      d.deps,
    );
    const b = await sendTest(
      parseArgs(["--theme", "majordome", "--sample", "nope", "--to", "claude@example.com"]),
      env,
      d.deps,
    );
    expect([a.code, b.code]).toEqual([2, 2]);
    expect(d.calls).toHaveLength(0);
  });
});

describe("F8 mailbox allow-list", () => {
  it("refuses an address outside the allow-list unless --allow-any is given", async () => {
    const d = deps([json(200, { id: "msg_9" })]);
    const out = ["--theme", "dream-studio", "--sample", "notice", "--to", "someone@example.org"];
    const refused = await sendTest(parseArgs(out), env, d.deps);
    expect(refused.code).toBe(2);
    expect(d.calls).toHaveLength(0);
    const allowed = await sendTest(parseArgs([...out, "--allow-any"]), env, d.deps);
    expect(allowed.code).toBe(0);
    expect(d.calls).toHaveLength(1);
  });

  it("refuses everything when no allow-list is configured", async () => {
    const d = deps([]);
    const result = await sendTest(
      parseArgs(args),
      { ...env, MAIL_KIT_TEST_MAILBOXES: undefined },
      d.deps,
    );
    expect(result.code).toBe(2);
    expect(d.calls).toHaveLength(0);
  });
});

describe("F8 429 retry", () => {
  it("waits retry-after once, then succeeds", async () => {
    const d = deps([json(429, {}, { "retry-after": "3" }), json(200, { id: "msg_2" })]);
    const result = await sendTest(parseArgs(args), env, d.deps);
    expect(d.sleeps).toEqual([3000]);
    expect(d.calls).toHaveLength(2);
    expect(result.code).toBe(0);
  });

  it("stops with the status after a second 429, no third request", async () => {
    const d = deps([json(429, {}, { "retry-after": "1" }), json(429, {}, { "retry-after": "1" })]);
    const result = await sendTest(parseArgs(args), env, d.deps);
    expect(d.sleeps).toHaveLength(1);
    expect(d.calls).toHaveLength(2);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("429");
  });
});
