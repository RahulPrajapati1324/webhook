import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.text({ type: '*/*' }));

/* ----------------------------------
   Webhook - App Installed
---------------------------------- */
app.post('/webhooks/app-installed', async (req, res) => {
  res.status(200).send("OK");

  try {
    const rawBody = req.body;

    let payload;
    try {
      payload = jwt.verify(rawBody, process.env.WIX_PUBLIC_KEY, { algorithms: ["RS256"] });
    } catch (jwtErr) {
      console.warn("JWT verify failed, decoding without verification:", jwtErr.message);
      payload = jwt.decode(rawBody);
    }

    const event = typeof payload.data === "string"
      ? JSON.parse(payload.data)
      : (payload.data ?? {});

    const eventType  = event.eventType  ?? "undefined";
    const instanceId = event.instanceId ?? "undefined";

    const identity  = typeof event.identity === "string" ? JSON.parse(event.identity) : (event.identity ?? {});
    const eventData = typeof event.data      === "string" ? JSON.parse(event.data)     : (event.data     ?? {});

    const identityType = identity?.identityType                            ?? "undefined";
    const wixUserId    = identity?.wixUserId ?? identity?.anonymousVisitorId ?? "undefined";
    const appId        = eventData?.appId                                  ?? "undefined";
    const originId     = eventData?.originInstanceId                       ?? "undefined";

    console.log("Event Type:",    eventType);
    console.log("Instance ID:",   instanceId);
    console.log("Identity Type:", identityType);
    console.log("App ID:",        appId);

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
    await sendEmail({
      eventType: "ERROR", instanceId: "ERROR", identityType: "ERROR",
      wixUserId: "ERROR", appId: "ERROR", originId: "ERROR",
      ownerEmail: "ERROR", error: err.message
    }).catch(console.error);
  }
});

/* ----------------------------------
   Get Access Token
---------------------------------- */
async function getAccessToken(instanceId) {
  try {
    const response = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: JSON.stringify({
        grant_type:    "client_credentials",
        client_id:     process.env.WIX_APP_ID,
        client_secret: process.env.WIX_APP_SECRET,
        instance_id:   instanceId
      })
    });

    const data = await response.json();
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
   Get Owner Email
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

    if (!response.ok) {
      console.error("Get App Instance error:", response.status, data);
      return `API Error ${response.status}`;
    }

    return data?.instance?.site?.ownerInfo?.email
        ?? data?.site?.ownerInfo?.email
        ?? "Email not returned — add READ SITE OWNER EMAIL scope";

  } catch (err) {
    console.error("getOwnerEmail error:", err.message);
    return `Fetch failed: ${err.message}`;
  }
}

/* ----------------------------------
   Send Email via Resend HTTP API
   - No SMTP, works on Render free tier
   - Sign up at https://resend.com (100 emails/day free)
   - Get API key from Resend dashboard
   - Set RESEND_API_KEY env var on Render
   - Set RESEND_FROM_EMAIL to a verified sender (e.g. you@yourdomain.com)
   - Set NOTIFY_EMAIL to where you want to receive notifications
---------------------------------- */
async function sendEmail({ eventType, instanceId, identityType, wixUserId, appId, originId, ownerEmail, error }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type":  "application/json"
    },
    body: JSON.stringify({
      from:    process.env.RESEND_FROM_EMAIL,  // must be a verified sender in Resend
      to:      process.env.NOTIFY_EMAIL,       // your email to receive notifications
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
    })
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Resend API error:", result);
    throw new Error(`Resend failed: ${JSON.stringify(result)}`);
  }

  console.log("Email sent successfully via Resend:", result.id);
}

app.listen(3000, () => {
  console.log("Server started on port 3000");
});