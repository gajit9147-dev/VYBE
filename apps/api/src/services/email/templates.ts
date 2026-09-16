export function createVerificationEmailTemplate(verificationUrl: string, expiresInHours: number) {
  const subject = "Verify your email for VYBE";

  const text = `Welcome to VYBE!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in ${expiresInHours} hours. If you did not create a VYBE account, you can safely ignore this email.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1f2937; padding: 36px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #ec4899; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; }
    p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin: 16px 0; }
    .btn-wrap { margin: 28px 0; text-align: center; }
    .btn { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">VYBE</div>
    <h1>Verify Your Email Address</h1>
    <p>Welcome to VYBE! Confirm your email address to secure your account and access meaningful connections.</p>
    <div class="btn-wrap">
      <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify Email Address</a>
    </div>
    <p>This verification link will expire in ${expiresInHours} hours. If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #a78bfa; font-size: 13px;">${verificationUrl}</p>
    <div class="footer">
      If you did not sign up for VYBE, please ignore this email.
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
