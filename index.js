const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
} = require("./lib/functions");
const fs = require("fs");
const P = require("pino");
const config = require("./config");
const qrcode = require("qrcode-terminal");
const util = require("util");
const { sms, downloadMediaMessage } = require("./lib/msg");
const axios = require("axios");
const { File } = require("megajs");

const ownerNumber = config.OWNER_NUM;

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
  if (!config.SESSION_ID)
    return console.log("Please add your session to SESSION_ID env !!");
  const sessdata = config.SESSION_ID;
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
  filer.download((err, data) => {
    if (err) throw err;
    fs.writeFile(__dirname + "/auth_info_baileys/creds.json", data, () => {
      console.log("Session downloaded ✅");
    });
  });
}

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

//=============================================

async function connectToWA() {
  //mongo connect
  const connectDB = require("./lib/mongodb");
  connectDB();
  //=======================
  const { readEnv } = require("./lib/database");
  const config = await readEnv();
  const prefix = config.PREFIX;
  //===========================

  console.log("Connecting ❤️C_Y_B_E_R");
  const { state, saveCreds } = await useMultiFileAuthState(
    __dirname + "/auth_info_baileys/"
  );
  var { version } = await fetchLatestBaileysVersion();

  const cyber = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version,
  });

  cyber.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
      ) {
        connectToWA();
      }
    } else if (connection === "open") {
      console.log(" Installing... ");
      const path = require("path");
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          try {
            require("./plugins/" + plugin);
          } catch (e) {
            console.error(`Error loading plugin ${plugin}:`, e);
          }
        }
      });
      console.log("❤️C_Y_B_E_R❤️ installed successful ✅");
      console.log("❤️C_Y_B_E_R❤️ connected to whatsapp ✅");

      const up = `❤️C_Y_B_E_R❤️ connected successful ✅`;
      const up1 = `Hello Cyber, I made bot successful`;

      cyber.sendMessage(ownerNumber + "@s.whatsapp.net", {
        image: {
          url: `https://raw.githubusercontent.com/kavishkad12/CYBER-MD-WABOT/refs/heads/main/CYBER-MD.jpeg`,
        },
        caption: up,
      });
      cyber.sendMessage("94720552487@s.whatsapp.net", {
        image: {
          url: `https://raw.githubusercontent.com/kavishkad12/CYBER-MD-WABOT/refs/heads/main/CYBER-MD.jpeg`,
        },
        caption: up1,
      });
    }
  });

  cyber.ev.on("creds.update", saveCreds);

  cyber.ev.on("messages.upsert", async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;
    mek.message =
      getContentType(mek.message) === "ephemeralMessage"
        ? mek.message.ephemeralMessage.message
        : mek.message;

    if (
      mek.key &&
      mek.key.remoteJid === "status@broadcast" &&
      config.AUTO_READ_STATUS === "true"
    ) {
      await cyber.readMessages([mek.key]);
    }
    const m = sms(cyber, mek);
    const type = getContentType(mek.message);
    const body =
      type === "conversation"
        ? mek.message.conversation
        : type === "extendedTextMessage"
        ? mek.message.extendedTextMessage.text
        : "";
    const isCmd = body.startsWith(prefix);
    const command = isCmd
      ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
      : "";
    const senderNumber = mek.key.fromMe
      ? cyber.user.id.split(":")[0]
      : mek.key.participant || mek.key.remoteJid;

    if (senderNumber.includes("94720552487")) {
      if (m.message.reactionMessage) return;
      m.react("💕");
    }
  });
}
app.get("/", (req, res) => {
  res.send("hey, ❤️C_Y_B_E_R❤️ started✅");
});
app.listen(port, () =>
  console.log(`Server listening on port http://localhost:${port}`)
);
setTimeout(() => {
  connectToWA();
}, 4000);
