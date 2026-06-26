import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com", // Replace with your emails
        pass: "your-email-password", // Use an App Password instead of your actual password for security
    },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("========== SMTP VERIFY ERROR ==========");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error(error);
  } else {
    console.log("========== SMTP READY ==========");
    console.log(success);
  }
});

export async function sendEmail(to, subject, text) {
    try {
        const info = await transporter.sendMail({
            from: "your-email@gmail.com",
            to,
            subject,
            text,
        });

        console.log("Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
