const nodemailer = require("nodemailer");

// Create a transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail password or app-specific password
  },
});

// Function to send an email
async function sendMail({ to, subject, text }) {
  try {
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_FROM}>`, // Sender address with a name
      to, // Recipient address
      subject, // Email subject
      text, // Plain text body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info; // Return the info object for further use if needed
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

module.exports = sendMail;