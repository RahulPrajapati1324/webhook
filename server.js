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

    // Decode JWT (verify signature if WIX_PUBLIC_KEY is set, otherwise just decode)
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

    const identityType = identity?.identityType      ?? "undefined";
    const wixUserId    = identity?.wixUserId         ?? identity?.anonymousVisitorId ?? "undefined";
    const appId        = eventData?.appId            ?? "undefined";
    const originId     = eventData?.originInstanceId ?? "undefined";

    console.log("Event Type:",    eventType);
    console.log("Instance ID:",   instanceId);
    console.log("Identity Type:", identityType);
    console.log("App ID:",        appId);

    // Step 1: Get an access token using instanceId + app credentials
    // Step 2: Use access token to call Get App Instance API for ownerEmail
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
      eventType:    "ERROR",
      instanceId:   "ERROR",
      identityType: "ERROR",
      wixUserId:    "ERROR",
      appId:        "ERROR",
      originId:     "ERROR",
      ownerEmail:   "ERROR",
      error:        err.message
    }).catch(console.error);
  }
});

/* ----------------------------------
   Step 1: Get Access Token from Wix
   POST https://www.wix.com/oauth/access
   Requires: WIX_APP_ID + WIX_APP_SECRET env vars
   Docs: https://dev.wix.com/docs/api-reference/app-management/oauth-2/create-access-token
---------------------------------- */
async function getAccessToken(instanceId) {
  try {
    const response = await fetch("https://www.wix.com/oauth/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type:    "client_credentials",
        client_id:     process.env.WIX_APP_ID,
        client_secret: process.env.WIX_APP_SECRET,
        instance_id:   instanceId
      })
    });

    const data = await response.json();
    console.log("Access token response:", JSON.stringify(data, null, 2));

    if (!response.ok || !data.access_token) {
      console.error("Failed to get access token:", data);
      return null;
    }

    return data.access_token;

  } catch (err) {
    console.error("getAccessToken error:", err.message);
    return null;
  }
}

/* ----------------------------------
   Step 2: Get Owner Email via Get App Instance
   GET https://www.wixapis.com/apps/v1/instance
   Requires: READ SITE OWNER EMAIL permission scope in your Wix app dashboard
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
                    ?? "Email not returned — ensure READ SITE OWNER EMAIL scope is added";

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