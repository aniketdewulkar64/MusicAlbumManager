const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    // Use ethereal for testing
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal@example.com', pass: 'test' },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Music App <noreply@musicapp.com>',
    to,
    subject,
    html,
  });
};

const emailTemplates = {
  passwordReset: (resetUrl) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#7c3aed">🎵 Music Album Manager</h2>
      <h3>Password Reset Request</h3>
      <p>Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
      <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Reset Password</a>
      <p style="color:#888;margin-top:20px;font-size:12px">If you didn't request this, please ignore this email.</p>
    </div>
  `,
  emailVerification: (verifyUrl) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#7c3aed">🎵 Music Album Manager</h2>
      <h3>Verify Your Email</h3>
      <p>Welcome! Click the button below to verify your email address.</p>
      <a href="${verifyUrl}" style="background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Verify Email</a>
    </div>
  `,
};

module.exports = { sendEmail, emailTemplates };
