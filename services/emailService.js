const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,        // Port 465 (SSL) works on Render — port 587 is blocked
    secure: true,     // Must be true for port 465
    family: 4,        // Force IPv4 — Render blocks IPv6
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"CloudClip" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your CloudClip verification code`,
    text: `Hi ${name},\n\nYour CloudClip verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, ignore this email.\n\n— CloudClip`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0c0c0e;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#141416;border:1px solid #2a2a2f;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#7c6af7;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;font-size:20px;line-height:1;">📋</td>
                  <td style="padding-left:12px;">
                    <span style="font-family:sans-serif;font-size:20px;font-weight:800;color:#fff;">CloudClip</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#7a7a88;letter-spacing:0.06em;text-transform:uppercase;">Email Verification</p>
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#e8e8ee;">Hi ${name}, verify your email</h2>
              <p style="margin:0 0 28px;font-size:14px;color:#7a7a88;line-height:1.6;">
                Use the code below to complete your CloudClip registration.
                It expires in <strong style="color:#e8e8ee;">10 minutes</strong>.
              </p>
              <div style="background:#1c1c1f;border:1px solid #2a2a2f;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <div style="font-size:11px;color:#4a4a56;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Your verification code</div>
                <div style="font-size:42px;font-weight:700;letter-spacing:0.18em;color:#a89cf9;font-family:'Courier New',monospace;">${otp}</div>
              </div>
              <p style="margin:0;font-size:12px;color:#4a4a56;line-height:1.6;">
                If you did not create a CloudClip account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #2a2a2f;">
              <p style="margin:0;font-size:11px;color:#4a4a56;text-align:center;">
                © CloudClip — This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };