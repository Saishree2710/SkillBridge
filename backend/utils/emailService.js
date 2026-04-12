const nodemailer = require('nodemailer');

const createTransporter = async () => {
  // Use Ethereal for testing
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  
  return transporter;
};

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"SkillBridge" <noreply@skillbridge.com>',
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent to %s: %s", to, info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
