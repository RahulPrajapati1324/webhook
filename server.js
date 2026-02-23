// // // import express from "express";
// // // import jwt from "jsonwebtoken";
// // // import nodemailer from "nodemailer";
// // // import cors from "cors";

// // // app.use(cors());
// // // app.use(express.json());

// // // const app = express();

// // // app.post("/webhooks/app-installed", async (req, res) => {
// // //   try {
// // //     const token = req.body;
// // //     const decoded = jwt.decode(token);

// // //     console.log("Webhook received:", decoded);

// // //     if (decoded?.data?.eventType === "AppInstalled") {
// // //       const instanceId = decoded.data.instanceId;
// // //       await sendEmail(instanceId);
// // //     }

// // //     res.status(200).send("OK");
// // //   } catch (error) {
// // //     console.error(error);
// // //     res.status(500).send("Error");
// // //   }
// // // });

// // // async function sendEmail(instanceId) {
// // //   const transporter = nodemailer.createTransport({
// // //     service: "gmail",
// // //     auth: {
// // //       user: process.env.EMAIL_USER,
// // //       pass: process.env.EMAIL_PASS
// // //     }
// // //   });

// // //   await transporter.sendMail({
// // //     from: process.env.EMAIL_USER,
// // //     to: process.env.EMAIL_USER,
// // //     subject: "New Wix App Installed 🎉",
// // //     text: `New installation detected.\nInstance ID: ${instanceId}`
// // //   });
// // // }

// // // const PORT = process.env.PORT || 3000;
// // // app.listen(PORT, () => {
// // //   console.log(`Server running on port ${PORT}`);
// // // });

// // import express from 'express'
// // import jwt from 'jsonwebtoken'
// // import nodemailer from 'nodemailer'
// // import cors from 'cors'

// // const app = express()

// // app.use(cors())
// // app.use(express.json())

// // const installs = [];

// // app.post('/webhooks/app-installed', async (req, res) => {
// //   try {
// //     const ownerEmail = req.body?.site?.ownerEmail;
// //     const instanceId = req.body?.instance?.instanceId;
// //     const siteId = req.body?.site?.siteId;

// //     const installData = {
// //       instanceId,
// //       ownerEmail,
// //       siteId,
// //       installedAt: new Date()
// //     };

// //     installs.push(installData);

// //     console.log("Stored Install:", installData);

// //     res.status(200).json({
// //       success: true,
// //       message: "Install stored in memory",
// //       data: installData
// //     });

// //   } catch (error) {
// //     console.error('Webhook Error:', error.message);
// //     res.status(500).send('Webhook failed');
// //   }
// // });

// // app.get('/installs', (req, res) => {
// //   res.json(installs);
// // });

// // /* ----------------------------------
// //    Send Email Function
// // ---------------------------------- */
// // async function sendEmail (instanceId) {
// //   const transporter = nodemailer.createTransport({
// //     service: 'gmail',
// //     auth: {
// //       user: process.env.EMAIL_USER,
// //       pass: process.env.EMAIL_PASS
// //     }
// //   })

// //   await transporter.sendMail({
// //     from: process.env.EMAIL_USER,
// //     to: process.env.EMAIL_USER,
// //     subject: 'New Wix App Installed',
// //     text: `A new user installed your Wix app.

// // Instance ID: ${instanceId}

// // Time: ${new Date().toLocaleString()}`
// //   })

// //   console.log('Email sent successfully')
// // }

// // /* ----------------------------------
// //    Start Server
// // ---------------------------------- */
// // const PORT = process.env.PORT || 3000

// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`)
// // })










// import express from "express";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";

// const app = express();

// /* ----------------------------------
//    IMPORTANT: Use express.text()
// ---------------------------------- */
// app.post('/webhooks/app-installed', express.text({ type: '*/*' }), async (req, res) => {

//   try {

//     const rawPayload = jwt.verify(
//       req.body,
//       process.env.WIX_PUBLIC_KEY,
//       { algorithms: ["RS256"] }
//     );

//     const event = JSON.parse(rawPayload.data);
//     const eventData = JSON.parse(event.data);

//     console.log("Event Type:", event.eventType);
//     console.log("Event Data:", eventData);

//     if (event.eventType === "AppInstalled") {

//       const instanceId = event.instanceId;
//       const ownerEmail = eventData.site?.ownerEmail;

//       console.log("Instance ID:", instanceId);
//       console.log("Owner Email:", ownerEmail);

//       if (ownerEmail) {
//         await sendEmail(ownerEmail, instanceId);
//       }
//     }

//     res.status(200).send("Webhook processed");

//   } catch (err) {
//     console.error("Webhook Error:", err.message);
//     res.status(400).send(`Webhook error: ${err.message}`);
//   }
// });

// /* ----------------------------------
//    Send Email
// ---------------------------------- */
// async function sendEmail(ownerEmail, instanceId) {

//   const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false,
//     family: 4, // Force IPv4
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: process.env.EMAIL_USER,
//     subject: "🎉 New Wix App Installed",
//     text: `
// New Installation Detected

// Owner Email: ${ownerEmail}
// Instance ID: ${instanceId}
// Time: ${new Date().toLocaleString()}
// `
//   });

//   console.log("Email sent successfully");
// }

// app.listen(3000, () => {
//   console.log("Server started on port 3000");
// });



// // import express from 'express'
// // import jwt from 'jsonwebtoken'
// // import nodemailer from 'nodemailer'
// // import fetch from 'node-fetch'

// // const app = express()

// // /* ----------------------------------
// //    IMPORTANT: Use express.text()
// // ---------------------------------- */
// // app.post(
// //   '/webhooks/app-installed',
// //   express.text({ type: '*/*' }),
// //   async (req, res) => {
// //     try {
// //       /* -------------------------------
// //        1️⃣ Verify Wix JWT
// //     -------------------------------- */
// //       const rawPayload = jwt.verify(req.body, process.env.WIX_PUBLIC_KEY, {
// //         algorithms: ['RS256']
// //       })

// //       const event = JSON.parse(rawPayload.data)

// //       console.log('Event Type:', event.eventType)

// //       /* -------------------------------
// //        2️⃣ Handle AppInstalled Event
// //     -------------------------------- */
// //       // if (event.eventType === "AppInstalled") {

// //       //   const instanceId = event.instanceId;
// //       //   const accessToken = rawPayload.instance?.accessToken;

// //       //   console.log("Instance ID:", instanceId);
// //       //   console.log("Access Token Exists:", !!accessToken);

// //       //   if (!accessToken) {
// //       //     return res.status(400).send("Access token missing");
// //       //   }

// //       //   /* -------------------------------
// //       //      3️⃣ Call Wix Instance API
// //       //   -------------------------------- */
// //       //   const wixResponse = await fetch(
// //       //     "https://www.wixapis.com/apps/v1/instance",
// //       //     {
// //       //       method: "GET",
// //       //       headers: {
// //       //         Authorization: `Bearer ${accessToken}`,
// //       //         "Content-Type": "application/json"
// //       //       }
// //       //     }
// //       //   );

// //       //   const instanceData = await wixResponse.json();

// //       //   console.log("Instance API Response:", instanceData);

// //       //   const ownerEmail = instanceData?.site?.ownerEmail;

// //       //   console.log("Owner Email:", ownerEmail);

// //       //   /* -------------------------------
// //       //      4️⃣ Send Email If Email Exists
// //       //   -------------------------------- */
// //       //   if (ownerEmail) {
// //       //     await sendEmail(ownerEmail, instanceId);
// //       //   } else {
// //       //     console.log("Owner email not found in instance API response");
// //       //   }
// //       // }

// //       if (event.eventType === 'AppInstalled') {
// //         const instanceId = event.instanceId
// //         const accessToken = rawPayload.instanceToken

// //         console.log('Instance ID:', instanceId)
// //         console.log('Access Token Exists:', !!accessToken)

// //         if (!accessToken) {
// //           return res.status(400).send('Access token missing')
// //         }

// //         const wixResponse = await fetch(
// //           'https://www.wixapis.com/apps/v1/instance',
// //           {
// //             method: 'GET',
// //             headers: {
// //               Authorization: `Bearer ${accessToken}`,
// //               'Content-Type': 'application/json'
// //             }
// //           }
// //         )

// //         const instanceData = await wixResponse.json()

// //         console.log('Instance API Response:', instanceData)

// //         const ownerEmail = instanceData?.site?.ownerEmail

// //         console.log('Owner Email:', ownerEmail)

// //         if (ownerEmail) {
// //           await sendEmail(ownerEmail, instanceId)
// //         }
// //       }

// //       res.status(200).send('Webhook processed')
// //     } catch (err) {
// //       console.error('Webhook Error:', err.message)
// //       res.status(400).send(`Webhook error: ${err.message}`)
// //     }
// //   }
// // )

// // /* ----------------------------------
// //    Send Email Function
// // ---------------------------------- */
// // async function sendEmail (ownerEmail, instanceId) {
// //   const transporter = nodemailer.createTransport({
// //     host: 'smtp.gmail.com',
// //     port: 587,
// //     secure: false,
// //     family: 4,
// //     auth: {
// //       user: process.env.EMAIL_USER,
// //       pass: process.env.EMAIL_PASS
// //     }
// //   })

// //   await transporter.sendMail({
// //     from: process.env.EMAIL_USER,
// //     to: process.env.EMAIL_USER, // Change if you want to send to ownerEmail
// //     subject: '🎉 New Wix App Installed',
// //     text: `
// // New Installation Detected

// // Owner Email: ${ownerEmail}
// // Instance ID: ${instanceId}
// // Time: ${new Date().toLocaleString()}
// // `
// //   })

// //   console.log('Email sent successfully')
// // }

// // /* ----------------------------------
// //    Start Server
// // ---------------------------------- */
// // app.listen(3000, () => {
// //   console.log('🚀 Server started on port 3000')
// // })


import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const app = express();

// Wix sends a JWT as raw text body
app.use(express.text({ type: '*/*' }));

/* ----------------------------------
   Webhook - App Installed
---------------------------------- */
app.post('/webhooks/app-installed', async (req, res) => {
  // Respond immediately so Wix does NOT timeout
  res.status(200).send("OK");

  try {
    const rawBody = req.body;
    console.log("Raw body (first 100 chars):", String(rawBody).substring(0, 100));

    // Wix sends the webhook as a signed JWT — decode without verifying first to inspect
    // Then verify with your public key
    let payload;
    try {
      payload = jwt.verify(rawBody, process.env.WIX_PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (jwtErr) {
      console.warn("JWT verify failed, trying decode without verification:", jwtErr.message);
      // Fallback: decode without verification (for testing only)
      payload = jwt.decode(rawBody);
    }

    console.log("JWT payload:", JSON.stringify(payload, null, 2));

    // payload.data is a stringified JSON
    const event = typeof payload.data === "string"
      ? JSON.parse(payload.data)
      : (payload.data ?? {});

    console.log("Event:", JSON.stringify(event, null, 2));

    const eventType  = event.eventType  ?? "undefined";
    const instanceId = event.instanceId ?? "undefined";

    // identity and data inside event are also stringified JSON
    const identity  = typeof event.identity === "string" ? JSON.parse(event.identity) : (event.identity ?? {});
    const eventData = typeof event.data      === "string" ? JSON.parse(event.data)     : (event.data     ?? {});

    const wixUserId = identity?.wixUserId         ?? "undefined";
    const appId     = eventData?.appId            ?? "undefined";
    const originId  = eventData?.originInstanceId ?? "undefined";

    console.log("Event Type:",  eventType);
    console.log("Instance ID:", instanceId);
    console.log("Wix User ID:", wixUserId);
    console.log("App ID:",      appId);

    // Fetch owner email from Wix Get App Instance API
    let ownerEmail = "Not available";
    if (instanceId !== "undefined") {
      ownerEmail = await getOwnerEmail(instanceId);
    }

    console.log("Owner Email:", ownerEmail);

    await sendEmail({ eventType, instanceId, wixUserId, appId, originId, ownerEmail });

  } catch (err) {
    console.error("Webhook processing error:", err.message);
    console.error(err.stack);
    await sendEmail({
      eventType:  "ERROR",
      instanceId: "ERROR",
      wixUserId:  "ERROR",
      appId:      "ERROR",
      originId:   "ERROR",
      ownerEmail: "ERROR",
      error:      err.message
    }).catch(console.error);
  }
});

/* ----------------------------------
   Fetch Owner Email via Wix API
---------------------------------- */
async function getOwnerEmail(instanceId) {
  try {
    const response = await fetch("https://www.wixapis.com/apps/v1/instance", {
      method: "GET",
      headers: {
        "Authorization": instanceId,
        "Content-Type":  "application/json"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Wix API error:", response.status, errText);
      return `API Error ${response.status}: ${errText}`;
    }

    const data = await response.json();
    console.log("Wix Instance API response:", JSON.stringify(data, null, 2));

    const ownerEmail = data?.instance?.site?.ownerInfo?.email
                    ?? data?.site?.ownerInfo?.email
                    ?? "Email not returned (check READ SITE OWNER EMAIL scope)";

    return ownerEmail;

  } catch (err) {
    console.error("getOwnerEmail error:", err.message);
    return `Fetch failed: ${err.message}`;
  }
}

/* ----------------------------------
   Send Email
   NOTE: Render.com blocks port 587 — using port 465 (SSL) instead
---------------------------------- */
async function sendEmail({ eventType, instanceId, wixUserId, appId, originId, ownerEmail, error }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,       // 587 is blocked on Render — use 465 with SSL
    secure: true,    // true for port 465
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to:   process.env.EMAIL_USER,
    subject: `Wix Webhook: ${eventType}`,
    text: `
Wix Webhook Received
---------------------
Event Type:         ${eventType}
Instance ID:        ${instanceId}
Owner Email:        ${ownerEmail}
Wix User ID:        ${wixUserId}
App ID:             ${appId}
Origin Instance ID: ${originId}
Time:               ${new Date().toLocaleString()}
${error ? `\nError: ${error}` : ""}
    `
  });

  console.log("Email sent successfully");
}

app.listen(3000, () => {
  console.log("Server started on port 3000");
});