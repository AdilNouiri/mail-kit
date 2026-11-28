function base64Lines(text: string): string {
  return (
    Buffer.from(text, "utf8")
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\r\n") ?? ""
  );
}

export interface EmlInput {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly from?: string;
  readonly to?: string;
}

/** A multipart/alternative message (text then html) that Quick Look opens without an account. */
export function buildEml(input: EmlInput): string {
  const boundary = "mail-kit-t12-boundary";
  const subject = `=?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`;
  const lines = [
    `From: ${input.from ?? "mail-kit-test@example.com"}`,
    `To: ${input.to ?? "reader@example.com"}`,
    `Subject: ${subject}`,
    "Date: Sat, 28 Nov 2026 09:00:00 +0000",
    "Message-ID: <t12@example.com>",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(input.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(input.html),
    `--${boundary}--`,
    "",
  ];
  return lines.join("\r\n");
}
