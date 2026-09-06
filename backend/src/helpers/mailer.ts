import nodemailer, { type Transporter } from "nodemailer";
import config from "@/config";

let transporter: Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.host || !config.smtp.user) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

export type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendMail = async (options: MailOptions): Promise<boolean> => {
  const transport = getTransporter();
  if (!transport) {
    console.warn("⚠️  SMTP not configured — email not sent:", options.subject);
    return false;
  }

  await transport.sendMail({
    from: config.smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return true;
};

export const verifySmtp = async (): Promise<void> => {
  const transport = getTransporter();
  if (!transport) {
    console.log("⚠️  SMTP not configured — email features disabled");
    return;
  }

  try {
    await transport.verify();
    console.log("✅ SMTP connection verified");
  } catch (err) {
    console.warn("⚠️  SMTP verification failed — emails may not send:", err);
  }
};
