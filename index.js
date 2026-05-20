const express = require("express")
const app = express()

app.get("/", (req, res) => {
res.send("GOJO BOT ONLINE ⚡")
})

app.listen(process.env.PORT || 3000)

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")

const prefix = "!"
const admins = ["639164712839"]

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("./sessao")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
auth: state,
logger: P({ level: "silent" }),
printQRInTerminal: false
})

/* 🔥 AUTO PAIRING SEM NÚMERO FIXO */
setTimeout(async () => {

try {

// tenta pegar ENV (se tiver)
let phoneNumber = process.env.PHONE_NUMBER

// se não tiver, pede no log
if (!phoneNumber) {
console.log("⚠️ Nenhum número no Render, usando modo manual")
console.log("👉 Depois escaneia o código quando aparecer")
return
}

const code = await sock.requestPairingCode(phoneNumber)

console.log("\n🔥 CÓDIGO DE CONEXÃO:")
console.log(code)

} catch (e) {
console.log("Erro pairing:", e)
}

}, 3000)

/* CONEXÃO */
sock.ev.on("connection.update", (update) => {

const { connection, lastDisconnect } = update

if (connection === "open") {
console.log(`
╔════════════════════╗
║  GOJO BOT ONLINE ⚡
╚════════════════════╝
`)
}

if (connection === "close") {

const code = lastDisconnect?.error?.output?.statusCode

if (code !== DisconnectReason.loggedOut) {
startBot()
}

}

})

sock.ev.on("creds.update", saveCreds)

/* 👋 WELCOME */
sock.ev.on("group-participants.update", async (anu) => {

try {

const metadata = await sock.groupMetadata(anu.id)

for (const num of anu.participants) {

if (anu.action === "add") {

await sock.sendMessage(anu.id, {
text: `
👁️ DOMAIN EXPANSION 👁️

⚡ Bem vindo @${num.split("@")[0]}

📍 ${metadata.subject}
`,
mentions: [num]
})

}

}

} catch {}

})

/* 💬 COMANDOS */
sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return

const from = msg.key.remoteJid
const sender = msg.key.participant || from
const isGroup = from.endsWith("@g.us")

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text || ""

if (!body.startsWith(prefix)) return

const args = body.slice(prefix.length).split(/ +/)
const command = args.shift().toLowerCase()

const isAdmin = admins.includes(sender.split("@")[0])

const groupMetadata = isGroup
? await sock.groupMetadata(from)
: null

const groupName = isGroup ? groupMetadata.subject : "Privado"

/* MENU */
if (command === "menu") {

await sock.sendMessage(from, {
text: `
👁️ GOJO BOT MENU

👤 @${sender.split("@")[0]}
📍 ${groupName}

👑 !grupo abrir
👑 !grupo fechar
💤 !inativos
💤 !marcar
🤖 !ping
🤖 !bot
`,
mentions: [sender]
})

}

/* PING */
if (command === "ping") {
await sock.sendMessage(from, { text: "🏓 PONG ⚡" })
}

/* BOT */
if (command === "bot") {
await sock.sendMessage(from, { text: "🤖 GOJO BOT ONLINE ⚡" })
}

/* GRUPO */
if (command === "grupo") {

if (!isAdmin)
return sock.sendMessage(from, { text: "❌ Só ADM" })

if (args[0] === "fechar") {
await sock.groupSettingUpdate(from, "announcement")
}

if (args[0] === "abrir") {
await sock.groupSettingUpdate(from, "not_announcement")
}

}

})

}

startBot()
