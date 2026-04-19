import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendMail(body) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  const smtpHost = process.env.MAIL_HOST || "smtp.gmail.com";
  const smtpPort = process.env.MAIL_PORT
    ? parseInt(process.env.MAIL_PORT, 10)
    : 465;
  const smtpSecure = process.env.MAIL_SECURE
    ? process.env.MAIL_SECURE === "true"
    : true;

  let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // email username from .env
      pass: process.env.EMAIL_PASS, // email password from .env
    },
  });

  // send mail with defined transport object
  const mailFrom = process.env.MAIL_FROM || process.env.EMAIL_USER;
  const mailTo =
    process.env.MAIL_TO || process.env.RECIPIENTS || process.env.EMAIL_USER;
  const mailSubject = process.env.MAIL_SUBJECT || "Chore List";

  let info = await transporter.sendMail({
    from: mailFrom, // sender address (from .env)
    to: mailTo, // list of receivers (from .env)
    subject: mailSubject, // Subject line (from .env)
    text: "Chore list attached", // plain text body
    html: body, // html body
  });
}
