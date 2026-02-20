// import express from "express";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import cors from "cors";

// app.use(cors());
// app.use(express.json());

// const app = express();

// app.post("/webhooks/app-installed", async (req, res) => {
//   try {
//     const token = req.body;
//     const decoded = jwt.decode(token);

//     console.log("Webhook received:", decoded);

//     if (decoded?.data?.eventType === "AppInstalled") {
//       const instanceId = decoded.data.instanceId;
//       await sendEmail(instanceId);
//     }

//     res.status(200).send("OK");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error");
//   }
// });

// async function sendEmail(instanceId) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: process.env.EMAIL_USER,
//     subject: "New Wix App Installed 🎉",
//     text: `New installation detected.\nInstance ID: ${instanceId}`
//   });
// }

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

/* ----------------------------------
   Health Check Route
---------------------------------- */
app.get('/', (req, res) => {
  res.send('Wix Webhook Server is Live 🚀')
})

/* ----------------------------------
   Wix App Installed Webhook
---------------------------------- */
// app.post("/webhooks/app-installed", async (req, res) => {
//   try {
//     const token = req.body;

//     if (!token) {
//       return res.status(400).send("No token received");
//     }

//     // 🔐 Verify JWT using Wix App Secret
//     const decoded = jwt.verify(token, process.env.WIX_APP_SECRET);

//     console.log("Decoded Webhook:", decoded);

//     if (decoded?.data?.eventType === "AppInstalled") {
//       const instanceId = decoded.data.instanceId;

//       console.log("New Installation:", instanceId);

//       await sendEmail(instanceId);
//     }

//     res.status(200).send("Webhook processed successfully");
//   } catch (error) {
//     console.error("Webhook Error:", error.message);
//     res.status(500).send("Webhook failed");
//   }
// });

app.post('/webhooks/app-installed', async (req, res) => {
  try {
    console.log('Incoming body:', req.body)

    const instanceId = req.body?.instance?.instanceId

    if (instanceId) {
      console.log('New Installation:', instanceId)
    }

    res.status(200).json({
      success: true,
      received: req.body
    })
  } catch (error) {
    console.error('Webhook Error:', error.message)
    res.status(500).send('Webhook failed')
  }
})
/* ----------------------------------
   Send Email Function
---------------------------------- */
async function sendEmail (instanceId) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: '🎉 New Wix App Installed',
    text: `A new user installed your Wix app.

Instance ID: ${instanceId}

Time: ${new Date().toLocaleString()}`
  })

  console.log('Email sent successfully')
}

/* ----------------------------------
   Start Server
---------------------------------- */
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
