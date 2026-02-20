// // server.js
// import express from "express";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";

// const app = express();
// app.use(express.json());

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
//       user: "yourgmail@gmail.com",
//       pass: "your-app-password"
//     }
//   });

//   await transporter.sendMail({
//     from: "yourgmail@gmail.com",
//     to: "yourgmail@gmail.com",
//     subject: "New Wix App Installed 🎉",
//     text: `New installation detected.\nInstance ID: ${instanceId}`
//   });
// }

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });



import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

app.post("/webhooks/app-installed", async (req, res) => {
  try {
    const token = req.body;
    const decoded = jwt.decode(token);

    console.log("Webhook received:", decoded);

    if (decoded?.data?.eventType === "AppInstalled") {
      const instanceId = decoded.data.instanceId;
      await sendEmail(instanceId);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

async function sendEmail(instanceId) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "New Wix App Installed 🎉",
    text: `New installation detected.\nInstance ID: ${instanceId}`
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});