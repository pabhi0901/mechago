import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendWorkerVerificationMail = async ({ to, name, accepted }) => {
  const subject = accepted
    ? "Congratulations! Your Worker Application is Approved"
    : "Update on Your Worker Application";

  const html = accepted
    ? `<h2>Hello ${name},</h2>
       <p>We are happy to let you know that your application to become a worker on <strong>We Care</strong> has been <strong style="color:green;">approved</strong>.</p>
       <p>You can now log in and start receiving service requests.</p>
       <p>Welcome aboard!</p>`
    : `<h2>Hello ${name},</h2>
       <p>Thank you for applying to become a worker on <strong>We Care</strong>.</p>
       <p>Unfortunately, your application has been <strong style="color:red;">rejected</strong> after review.</p>
       <p>If you believe this is a mistake or would like to reapply, please contact our support team.</p>`;

  await transporter.sendMail({
    from: `"We Care" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });
};
