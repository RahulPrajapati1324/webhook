import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const app = express();

// Wix sends webhook as a JWT in raw text body
app.use(express.text({ type: '*/*' }));

/* ----------------------------------
   Webhook - App Installed
---------------------------------- */
app.post('/webhooks/app-installed', async (req, res) => {
  // Respond immediately so Wix does NOT timeout
  res.status(200).send("OK");

  try {
    const rawBody = req.body;

    // Decode the JWT sent by Wix
    let payload;
    try {
      payload = jwt.verify(rawBody, process.env.WIX_PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (jwtErr) {
      console.warn("JWT verify failed, decoding without verification:", jwtErr.message);
      payload = jwt.decode(rawBody);
    }

    // payload.data is a stringified JSON string
    const event = typeof payload.data === "string"
      ? JSON.parse(payload.data)
      : (payload.data ?? {});

    const eventType  = event.eventType  ?? "undefined";
    const instanceId = event.instanceId ?? "undefined";

    const identity  = typeof event.identity === "string" ? JSON.parse(event.identity) : (event.identity ?? {});
    const eventData = typeof event.data      === "string" ? JSON.parse(event.data)     : (event.data     ?? {});

    const identityType = identity?.identityType            ?? "undefined";
    const wixUserId    = identity?.wixUserId               ?? identity?.anonymousVisitorId ?? "undefined";
    const appId        = eventData?.appId                  ?? "undefined";
    const originId     = eventData?.originInstanceId       ?? "undefined";

    console.log("Event Type:",    eventType);
    console.log("Instance ID:",   instanceId);
    console.log("Identity Type:", identityType);
    console.log("App ID:",        appId);

    // Get access token then fetch owner email
    let ownerEmail = "Not available";
    if (instanceId !== "undefined") {
      const accessToken = await getAccessToken(instanceId);
      if (accessToken) {
        ownerEmail = await getOwnerEmail(accessToken);
      }
    }

    console.log("Owner Email:", ownerEmail);

    await sendEmail({ eventType, instanceId, identityType, wixUserId, appId, originId, ownerEmail });

  } catch (err) {
    console.error("Webhook processing error:", err.message);
    console.error(err.stack);
    await sendEmail({
      eventType: "ERROR", instanceId: "ERROR", identityType: "ERROR",
      wixUserId: "ERROR", appId: "ERROR", originId: "ERROR",
      ownerEmail: "ERROR", error: err.message
    }).catch(console.error);
  }
});

/* ----------------------------------
   Step 1: Get Access Token
   POST https://www.wixapis.com/oauth2/token
   !! Body must be sent as a raw string (not JSON content-type) !!
---------------------------------- */
async function getAccessToken(instanceId) {
  try {
    const body = JSON.stringify({
      grant_type:    "client_credentials",
      client_id:     process.env.WIX_APP_ID,
      client_secret: process.env.WIX_APP_SECRET,
      instance_id:   instanceId
    });

    console.log("Requesting access token for instance:", instanceId);

    const response = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST",
      headers: {
        // Must be sent as raw bytes — Wix requires this specific content type
        "Content-Type": "application/octet-stream"
      },
      body: body  // raw string body
    });

    const text = await response.text();
    console.log("Access token raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Access token response is not JSON:", text);
      return null;
    }

    if (!response.ok || !data.access_token) {
      console.error("Failed to get access token:", data);
      return null;
    }

    console.log("Access token obtained successfully");
    return data.access_token;

  } catch (err) {
    console.error("getAccessToken error:", err.message);
    return null;
  }
}

/* ----------------------------------
   Step 2: Get Owner Email
   GET https://www.wixapis.com/apps/v1/instance
   Requires READ SITE OWNER EMAIL permission scope
---------------------------------- */
async function getOwnerEmail(accessToken) {
  try {
    const response = await fetch("https://www.wixapis.com/apps/v1/instance", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json"
      }
    });

    const data = await response.json();
    console.log("Get App Instance response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Get App Instance error:", response.status, data);
      return `API Error ${response.status}`;
    }

    const ownerEmail = data?.instance?.site?.ownerInfo?.email
                    ?? data?.site?.ownerInfo?.email
                    ?? "Email not returned — add READ SITE OWNER EMAIL scope in Wix Dev Center";

    return ownerEmail;

  } catch (err) {
    console.error("getOwnerEmail error:", err.message);
    return `Fetch failed: ${err.message}`;
  }
}

/* ----------------------------------
   Send Email (port 465 for Render.com)
---------------------------------- */
async function sendEmail({ eventType, instanceId, identityType, wixUserId, appId, originId, ownerEmail, error }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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
Identity Type:      ${identityType}
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