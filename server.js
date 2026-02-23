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






// import express from 'express'
// import jwt from 'jsonwebtoken'
// import nodemailer from 'nodemailer'
// import cors from 'cors'

// const app = express()

// app.use(cors())
// app.use(express.json())

// const installs = [];



// app.post('/webhooks/app-installed', async (req, res) => {
//   try {
//     const ownerEmail = req.body?.site?.ownerEmail;
//     const instanceId = req.body?.instance?.instanceId;
//     const siteId = req.body?.site?.siteId;

//     const installData = {
//       instanceId,
//       ownerEmail,
//       siteId,
//       installedAt: new Date()
//     };

//     installs.push(installData);

//     console.log("Stored Install:", installData);

//     res.status(200).json({
//       success: true,
//       message: "Install stored in memory",
//       data: installData
//     });

//   } catch (error) {
//     console.error('Webhook Error:', error.message);
//     res.status(500).send('Webhook failed');
//   }
// });

// app.get('/installs', (req, res) => {
//   res.json(installs);
// });

// /* ----------------------------------
//    Send Email Function
// ---------------------------------- */
// async function sendEmail (instanceId) {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   })

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: process.env.EMAIL_USER,
//     subject: '🎉 New Wix App Installed',
//     text: `A new user installed your Wix app.

// Instance ID: ${instanceId}

// Time: ${new Date().toLocaleString()}`
//   })

//   console.log('Email sent successfully')
// }

// /* ----------------------------------
//    Start Server
// ---------------------------------- */
// const PORT = process.env.PORT || 3000

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })


import express from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

const installs = []

/* ----------------------------------
   Webhook Endpoint
---------------------------------- */
app.post('/webhooks/app-installed', async (req, res) => {
  try {

    let data;

    // 🔎 If body is string → it's JWT
    if (typeof req.body === "string") {

      const decoded = jwt.verify(
        req.body,
        process.env.WIX_PUBLIC_KEY,
        { algorithms: ['RS256'] }
      );

      data = decoded?.data;

    } 
    // 🔎 If body is object → direct JSON (Postman)
    else if (typeof req.body === "object") {

      data = req.body;

    } else {
      return res.status(400).send("Invalid webhook payload");
    }

    console.log("Webhook Data:", data);

    const ownerEmail = data?.site?.ownerEmail;
    const instanceId = data?.instance?.instanceId;
    const siteId = data?.site?.siteId;

    const installData = {
      ownerEmail,
      instanceId,
      siteId,
      installedAt: new Date()
    };

    installs.push(installData);

    // Optional: send email
    if (ownerEmail) {
      await sendEmail(ownerEmail, instanceId);
    }

    res.status(200).json({
      success: true,
      data: installData
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.status(500).send("Webhook failed");
  }
});

/* ----------------------------------
   View Stored Installs
---------------------------------- */
app.get('/installs', (req, res) => {
  res.json(installs)
})

/* ----------------------------------
   Send Email
---------------------------------- */
async function sendEmail(ownerEmail, instanceId) {

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
    text: `
New Installation Detected 🚀

Owner Email: ${ownerEmail}
Instance ID: ${instanceId}
Time: ${new Date().toLocaleString()}
`
  })

  console.log("Email sent successfully")
}

/* ----------------------------------
   Start Server
---------------------------------- */
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})