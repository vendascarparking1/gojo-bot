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

/* 🔥 CONEXÃO POR CÓDIGO (SEM QR) */
if (!sock.authState.creds.registered) {

setTimeout(async () => {

const phoneNumber = "639164712839" // 👈 SEU NÚMERO AQUI

const code = await sock.requestPairingCode(phoneNumber)

console.log("\n🔥 SEU CÓDIGO DE CONEXÃO:")
console.log(code)
console.log("\n👉 Vá no WhatsApp > Dispositivos conectados > Conectar com código\n")

}, 3000)

}

/* 🔁 CONEXÃO */
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

const statusCode = lastDisconnect?.error?.output?.statusCode

if (statusCode !== DisconnectReason.loggedOut) {
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

📍 Grupo:
${metadata.subject}
`,
mentions: [num]
})

}

}

} catch (e) {}

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

const args = body.slice(prefix.length).trim().split(/ +/)
const command = args.shift().toLowerCase()

const isAdmin = admins.includes(sender.split("@")[0])

const groupMetadata = isGroup
? await sock.groupMetadata(from)
: null

const groupName = isGroup ? groupMetadata.subject : "Privado"

/* 👑 MENU */
if (command === "menu") {

await sock.sendMessage(from, {
text: `
╔════ MENU GOJO BOT ════╗

👤 @${sender.split("@")[0]}

👑 ${isAdmin ? "Admin" : "User"}

📍 ${groupName}

👑 MENU ADM
➤ !grupo abrir
➤ !grupo fechar

👋 BEM VINDO
➤ automático

💤 MENU INATIVOS
➤ !inativos
➤ !marcar

🤖 SISTEMA
➤ !ping
➤ !bot
➤ !menu

╚══════════════════════╝
`,
mentions: [sender]
})

}

/* 🏓 PING */
if (command === "ping") {
await sock.sendMessage(from, { text: "🏓 PONG ⚡ BOT ONLINE" })
}

/* 🤖 BOT */
if (command === "bot") {
await sock.sendMessage(from, {
text: "🤖 GOJO BOT ONLINE ⚡"
})
}

/* 👥 MARCAR */
if (command === "marcar") {
if (!isGroup) return

const participants = groupMetadata.participants

let txt = "👥 MARCANDO TODOS\n\n"
let mentions = []

for (let m of participants) {
txt += `➤ @${m.id.split("@")[0]}\n`
mentions.push(m.id)
}

await sock.sendMessage(from, { text: txt, mentions })
}

/* 💤 INATIVOS */
if (command === "inativos") {
if (!isGroup) return

const participants = groupMetadata.participants

let txt = "💤 MEMBROS DO GRUPO\n\n"
let mentions = []

participants.forEach((m, i) => {
txt += `${i + 1}. @${m.id.split("@")[0]}\n`
mentions.push(m.id)
})

await sock.sendMessage(from, { text: txt, mentions })
}

/* 👑 GRUPO */
if (command === "grupo") {

if (!isAdmin)
return sock.sendMessage(from, { text: "❌ Só ADM" })

if (args[0] === "fechar") {
await sock.groupSettingUpdate(from, "announcement")
await sock.sendMessage(from, { text: "🔒 Grupo fechado" })
}

if (args[0] === "abrir") {
await sock.groupSettingUpdate(from, "not_announcement")
await sock.sendMessage(from, { text: "🔓 Grupo aberto" })
}

}

})

}

startBot()
