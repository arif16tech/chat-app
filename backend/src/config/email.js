import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "ChatApp <noreply@chatapp.com>",
    to,
    subject,
    html,
  });
  return info;
};

export const sendOtpEmail = async (to, otp, purpose = "verification") => {
  const subjects = {
    verification: "Verify your ChatApp account",
    reset: "Reset your ChatApp password",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 12px; color: #f8fafc;">
      <h2 style="color: #6366f1; margin-bottom: 8px;">ChatApp 💬</h2>
      <h3 style="margin-bottom: 24px;">${purpose === "verification" ? "Verify your email" : "Reset your password"}</h3>
      <p style="color: #94a3b8; margin-bottom: 24px;">Use the OTP below. It expires in 10 minutes.</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 24px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #6366f1;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject: subjects[purpose], html });
};

export default transporter;
