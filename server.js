require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const SibApiV3Sdk = require("sib-api-v3-sdk");

const app = express();
const PORT = process.env.PORT || 8000;

// ====================
// BREVO CONFIGURATION
// ====================

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ====================
// MIDDLEWARE
// ====================

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

// ====================
// MULTER
// ====================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

console.log("Sender:", process.env.SENDER_EMAIL);

// ====================
// CONTACT ROUTE
// ====================

app.post("/contact", async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body;

    if (!name || !email || !mobile || !subject) {
      return res.status(400).json({
        success: false,
        error: "All fields are required.",
      });
    }

    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },

      to: process.env.RECEIVER_EMAIL
        .split(",")
        .map((email) => ({
          email: email.trim(),
        })),

      subject: `New Contact Form: ${subject}`,

      textContent: `
Name: ${name}
Email: ${email}
Mobile: ${mobile}

Message:
${message}
      `,
    });

    console.log("✅ Contact email sent");

    return res.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("CONTACT ERROR");
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ====================
// CAREER ROUTE
// ====================

app.post("/career", upload.single("resume"), async (req, res) => {
  try {
    console.log("========== CAREER REQUEST ==========");
    console.log(req.body);

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
      return res.status(400).json({
        success: false,
        error: "Required fields missing.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Resume file not received.",
      });
    }

    console.log("Filename:", req.file.originalname);
    console.log("Size:", req.file.size);

    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },

      to: process.env.RECEIVER_EMAIL
        .split(",")
        .map((email) => ({
          email: email.trim(),
        })),

      subject: `New Career Application: ${position}`,

      textContent: `
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

      attachment: [
        {
          name: req.file.originalname,
          content: req.file.buffer.toString("base64"),
        },
      ],
    });

    console.log("✅ Career email sent");

    return res.json({
      success: true,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error("========== CAREER ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ====================
// TEST ROUTE
// ====================

app.get("/email-test", async (req, res) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },

      to: process.env.RECEIVER_EMAIL
        .split(",")
        .map((email) => ({
          email: email.trim(),
        })),

      subject: "Brevo Test Email",

      textContent: "Brevo integration is working.",
    });

    res.json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ====================
// HEALTH CHECK
// ====================

app.get("/", (req, res) => {
  res.send("Server is running.");
});

// ====================
// START SERVER
// ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});