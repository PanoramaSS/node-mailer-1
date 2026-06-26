require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://panoramasoftwares.com",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Multer memory storage (recommended for Render)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 60000,
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail transporter error:", error);
  } else {
    console.log("✅ Mail server ready");
  }
});

function logEmailError(error, routeName) {
  console.error(`❌ Error in [${routeName}]`);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("Command:", error.command);
  console.error(error);
}

// CONTACT ROUTE
app.post("/contact", async (req, res) => {
  const { name, email, mobile, subject, message } = req.body;

  if (!name || !email || !mobile || !subject) {
    return res.status(400).json({
      success: false,
      error: "All fields are required.",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Mobile: ${mobile}

Message:
${message}
      `,
    });

    console.log("✅ Contact mail sent:", info.response);

    res.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    logEmailError(error, "CONTACT");

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// CAREER ROUTE
// CAREER ROUTE
app.post("/career", upload.single("resume"), async (req, res) => {
  try {
    console.log("========== CAREER REQUEST ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

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
      !passingYear
    ) {
      console.log("❌ Missing fields");

      return res.status(400).json({
        success: false,
        error: "Required fields missing.",
      });
    }

    if (!req.file) {
      console.log("❌ Resume not received.");

      return res.status(400).json({
        success: false,
        error: "Resume file not received.",
      });
    }

    console.log("✅ Preparing email...");
    console.log("Filename:", req.file.originalname);
    console.log("Size:", req.file.size);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Career Application: ${position}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Position: ${position}
Experience: ${experience}
Qualification: ${qualification}
Passing Year: ${passingYear}

Message:
${message}
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ],
    };

    console.log("📧 Sending email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);

    return res.json({
      success: true,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error("========== CAREER ERROR ==========");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// TEST ROUTE
app.get("/email-test", async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: "Test Email",
      text: "This is a test email.",
    });

    console.log("✅ Test email:", info.response);

    res.json({
      success: true,
      message: "Test email sent successfully.",
    });
  } catch (error) {
    logEmailError(error, "EMAIL-TEST");

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});