import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Real Email Config check
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === "465", // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    return await transporter.sendMail({
      from: `"Pink Dessert Catering" <${smtpUser}>`,
      to,
      subject,
      html,
      text: text || "Your OTP Code from Pink Dessert Catering",
    });
  } else {
    // FALLBACK SIMULATION: Log to terminal so CENG 382 students can easily copy it
    console.log("\n==========================================");
    console.log(`✉️ [EMAIL SIMULATION]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}`);
    console.log("==========================================\n");
    return { messageId: "simulated-id" };
  }
}
