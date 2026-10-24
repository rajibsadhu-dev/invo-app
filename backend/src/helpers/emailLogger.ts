import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "email-log.txt");

export type EmailLogEntry = {
  orgName: string;
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  attachmentSizeKb?: number;
  smtpSent: boolean;
};

export function logEmail(entry: EmailLogEntry): void {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const lines = [
    "──────────────────────────────────────────────",
    `Date:        ${timestamp}`,
    `Org:         ${entry.orgName}`,
    `To:          ${entry.to}`,
    `Subject:     ${entry.subject}`,
  ];

  if (entry.attachmentName) {
    lines.push(
      `Attachment:  ${entry.attachmentName} (${entry.attachmentSizeKb ?? "?"} KB)`
    );
  }

  lines.push(
    `SMTP:        ${entry.smtpSent ? "sent" : "not configured — logged only"}`
  );
  lines.push("Body:");

  const bodyLines = entry.body.split("\n").map((l) => `  ${l}`);
  lines.push(...bodyLines);

  lines.push("──────────────────────────────────────────────\n");

  fs.appendFileSync(LOG_FILE, lines.join("\n") + "\n", "utf-8");
}
