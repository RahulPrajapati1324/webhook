import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);
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

    const identityType = identity?.identityType                      ?? "undefined";
    const wixUserId    = identity?.wixUserId ?? identity?.anonymousVisitorId ?? "undefined";
    const appId        = eventData?.appId                            ?? "undefined";
    const originId     = eventData?.originInstanceId                 ?? "undefined";

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
    const body = JSON.stringify({
      grant_type:    "client_credentials",
      client_id:     process.env.WIX_APP_ID,
      client_secret: process.env.WIX_APP_SECRET,
      instance_id:   instanceId
    });

    const response = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body
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
   Send Email
   Fix: Render blocks IPv6 to Gmail — resolve smtp.gmail.com
   to an IPv4 address manually before connecting
---------------------------------- */
async function sendEmail({ eventType, instanceId, identityType, wixUserId, appId, originId, ownerEmail, error }) {
  // Force IPv4 by resolving Gmail's SMTP hostname ourselves
  let gmailIp;
  try {
    const addresses = await resolve4("smtp.gmail.com");
    gmailIp = addresses[0];
    console.log("Resolved smtp.gmail.com to IPv4:", gmailIp);
  } catch (dnsErr) {
    console.warn("DNS resolve failed, falling back to hostname:", dnsErr.message);
    gmailIp = "smtp.gmail.com";
  }

  const transporter = nodemailer.createTransport({
    host: gmailIp,      // Use the resolved IPv4 address directly
    port: 465,
    secure: true,
    tls: {
      // Must set servername when using IP so TLS cert matches
      servername: "smtp.gmail.com"
    },
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