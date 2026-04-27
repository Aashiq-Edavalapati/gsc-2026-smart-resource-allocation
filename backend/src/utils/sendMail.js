import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "NGO Verification OTP",
    text: `Your OTP is ${otp}`
  });
};

export const sendInviteMail = async ({ to, orgName, role, inviteId }) => {
  const inviteLink = `${process.env.CLIENT_URL}/invite/${inviteId}`;

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: `You're invited to join ${orgName}`,
    html: `
      <h2>You're invited!</h2>
      <p>You have been invited to join <b>${orgName}</b> as <b>${role}</b>.</p>
      <p>Click below to accept the invite:</p>
      <a href="${inviteLink}" style="padding:10px 16px;background:#4CAF50;color:white;text-decoration:none;border-radius:6px;">
        Accept Invite
      </a>
      <p>If you didn't expect this, ignore this email.</p>
    `
  });
};