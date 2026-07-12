// src/services/email.service.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify once at startup so a bad App Password fails loudly immediately,
// not silently the first time a real email tries to send.
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email service failed to connect:", error.message);
  } else {
    console.log("✅ Email service ready (Gmail)");
  }
});

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"TransitOps" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export function insuranceExpiredEmail(vehicle, recipientEmail) {
  return {
    to: recipientEmail,
    subject: `⚠ Insurance Expired — ${vehicle.registrationNo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color:#dc2626;">Vehicle Insurance Expired</h2>
        <p>The insurance for vehicle <strong>${vehicle.registrationNo}</strong> (${vehicle.name})
        ${vehicle.insuranceNumber ? `— policy <strong>${vehicle.insuranceNumber}</strong> —` : ""}
        expired on <strong>${new Date(vehicle.insuranceExpiry).toLocaleDateString()}</strong>.</p>
        <p>This vehicle has been automatically flagged. Please renew the insurance and update
        the record in TransitOps as soon as possible.</p>
        <p style="color:#6b7280; font-size: 12px; margin-top: 24px;">
          Automated notice — TransitOps Fleet Management.
        </p>
      </div>
    `,
  };
}

export function licenseExpiryEmail(driver, daysRemaining) {
  const isExpired = daysRemaining < 0;
  const daysAgo = Math.abs(daysRemaining);

  return {
    to: driver.email,
    subject: isExpired
      ? `⚠ License Expired — ${driver.name}`
      : `⚠ License Expiring in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color:#dc2626;">License Expiry Notice</h2>
        <p>Hi ${driver.name},</p>
        <p>Your driving license (<strong>${driver.licenseNumber}</strong>)
        ${isExpired
          ? `expired on <strong>${new Date(driver.licenseExpiry).toLocaleDateString()}</strong>
             — ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago.`
          : `expires on <strong>${new Date(driver.licenseExpiry).toLocaleDateString()}</strong>
             — ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} from now.`}
        </p>
        <p>Please renew it ${isExpired ? "immediately" : "soon"}. Drivers with expired licenses cannot be assigned to
        trips in TransitOps and will be automatically restricted.</p>
        <p style="color:#6b7280; font-size: 12px; margin-top: 24px;">
          Automated notice — TransitOps Fleet Management.
        </p>
      </div>
    `,
  };
}