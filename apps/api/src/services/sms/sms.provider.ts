import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { maskPhoneNumber } from "../../utils/phone.js";

export interface SmsMessageOptions {
  to: string;
  message: string;
}

export interface SmsProvider {
  name: string;
  sendSms(options: SmsMessageOptions): Promise<void>;
}

/**
 * In-memory SMS provider for development and automated test suites.
 * Does not pretend SMS was actually dispatched over carrier networks.
 * Never logs raw OTP.
 */
export class InMemorySmsProvider implements SmsProvider {
  public readonly name = "InMemorySmsProvider";
  private sentMessages: SmsMessageOptions[] = [];

  async sendSms(options: SmsMessageOptions): Promise<void> {
    this.sentMessages.push({ ...options });
    logger.info(
      {
        provider: this.name,
        recipient: maskPhoneNumber(options.to)
      },
      "Development SMS dispatch simulated (no external carrier contacted)"
    );
  }

  getSentMessages(): SmsMessageOptions[] {
    return [...this.sentMessages];
  }

  getLastMessage(): SmsMessageOptions | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  clear(): void {
    this.sentMessages = [];
  }
}

/**
 * Production Twilio SMS provider.
 * Uses HTTP Basic Auth to Twilio's REST API endpoint.
 * Credentials come strictly from environment variables.
 */
export class TwilioSmsProvider implements SmsProvider {
  public readonly name = "TwilioSmsProvider";
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = env.TWILIO_ACCOUNT_SID || "";
    this.authToken = env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = env.TWILIO_FROM_NUMBER || "";

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "Twilio SMS provider configured but missing required environment variables: " +
          "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER"
        );
      }
    }
  }

  async sendSms(options: SmsMessageOptions): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

    const formBody = new URLSearchParams({
      To: options.to,
      From: this.fromNumber,
      Body: options.message
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          statusCode: response.status,
          recipient: maskPhoneNumber(options.to)
        },
        "Twilio SMS dispatch failed"
      );
      throw new Error(`SMS delivery failed with status ${response.status}`);
    }

    logger.info(
      {
        provider: this.name,
        recipient: maskPhoneNumber(options.to)
      },
      "SMS dispatched via Twilio carrier gateway"
    );
  }
}

// Instantiate configured provider
export const smsProvider: SmsProvider =
  env.SMS_PROVIDER === "twilio" ? new TwilioSmsProvider() : new InMemorySmsProvider();
