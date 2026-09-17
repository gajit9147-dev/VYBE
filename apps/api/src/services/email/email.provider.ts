import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

export class InMemoryEmailProvider implements EmailProvider {
  private sentEmails: SendEmailOptions[] = [];

  async send(options: SendEmailOptions): Promise<void> {
    this.sentEmails.push(options);
    logger.info({ to: options.to, subject: options.subject }, "Email sent via InMemoryEmailProvider");

    // In development mode, print the verification link clearly in the server console
    if (env.NODE_ENV !== "production") {
      console.log("\n=======================================================");
      console.log(`📨 [LOCAL DEV EMAIL DISPATCHED]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      const linkMatch = options.text.match(/https?:\/\/[^\s]+/);
      if (linkMatch) {
        console.log(`🔗 Click to verify:\n   ${linkMatch[0]}`);
      }
      console.log("=======================================================\n");
    }
  }

  getSentEmails(): SendEmailOptions[] {
    return [...this.sentEmails];
  }

  getLastEmail(): SendEmailOptions | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  clear(): void {
    this.sentEmails = [];
  }
}

export class SmtpEmailProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    // If SMTP is configured, this would dispatch using nodemailer or native client
    logger.info({ to: options.to, subject: options.subject, host: env.SMTP_HOST }, "Email sent via SMTP Provider");
  }
}

// Singleton email provider instance
export const emailProvider = new InMemoryEmailProvider();
