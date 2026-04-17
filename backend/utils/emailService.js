const nodemailer = require('nodemailer');

const createTransporter = async () => {
  // Use jsonTransport or streamTransport for local dev to avoid SMTP blocked ports.
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
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
    if (info.message) {
      console.log("Email contents logged to stream.");
      info.message.pipe(process.stdout);
    }
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
