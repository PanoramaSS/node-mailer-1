require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 8000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Update with your frontend prod URL
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use(express.json());

// Multer setup for file upload (Career form)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Nodemailer transporter configuration for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function for detailed error logging
function logEmailError(error, routeName) {
  console.error(`❌ Error sending email in [${routeName}]`);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("Command:", error.command);
  console.error("Stack:", error.stack);
  try {
    console.error("Full error object:", JSON.stringify(error, null, 2));
  } catch {
    console.error("Could not stringify error object");
  }
}

// ----------- CONTACT FORM ROUTE -----------
app.post("/contact", async (req, res) => {
  const { name, email, mobile, subject, message } = req.body;

  if (!name || !email || !subject || !mobile) {
    return res
      .status(400)
      .json({ success: false, error: "All fields are required!" });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Contact Form Submission: ${subject}`,
    text: `You received a new message:\n\nName: ${name}\nEmail: ${email}\nMobile: ${mobile}\n\nMessage:\n${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Contact email sent:", info.response);
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    logEmailError(error, "CONTACT");
    res.status(500).json({ success: false, error: "Failed to send message." });
  }
});

// ----------- CAREER FORM ROUTE (with file upload) -----------
app.post("/career", upload.single("resume"), async (req, res) => {
  const {
    name,
    email,
    phone,
    position,
    experience,
    qualification,
    passingYear,
    message,
  } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !position ||
    !qualification ||
    !passingYear ||
    !req.file
  ) {
    return res.status(400).json({
      success: false,
      error: "All required fields including resume must be provided!",
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: `New Career Application for: ${position}`,
    text: `You received a new career application:\n\n
Name: ${name}
Email: ${email}
Phone: ${phone}
Position: ${position}
Experience: ${experience}
Qualification: ${qualification}
Year of Passing: ${passingYear}
Message: ${message}
    `,
    attachments: [
      {
        filename: req.file.originalname,
        path: req.file.path,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Career application email sent:", info.response);
    res.json({
      success: true,
      message: "Application submitted successfully!",
    });

    // Optional: Delete resume after sending
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete resume:", err);
    });
  } catch (error) {
    logEmailError(error, "CAREER");
    res.status(500).json({ success: false, error: "Failed to send application." });
  }
});

// Test route to debug quickly without forms
app.get("/email-test", async (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: "Test Email",
    text: "This is a test email from /email-test endpoint.",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Test email sent:", info.response);
    res.json({ success: true, message: "Test email sent successfully!" });
  } catch (error) {
    logEmailError(error, "EMAIL-TEST");
    res.status(500).json({ success: false, error: "Failed to send test email." });
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
