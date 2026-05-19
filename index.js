const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")
const qrcode = require("qrcode-terminal")

const prefix = "!"

const admins = ["5598981666909"]

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("./sessao")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
logger: P({ level: "silent" }),
auth: state
})

// QR CODE
sock.ev.on("connection.update",
async ({ connection, lastDisconnect, qr }) => {

if(qr) {

console.log("📲 ESCANEIE O QR CODE:\n")

qrcode.generate(qr, {
small: true
})

}

if(connection === "open") {

console.log(`
╔════════════════════╗
║  GOJO BOT ONLINE ⚡
╚════════════════════╝
`)

}

if(connection === "close") {

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode
!== DisconnectReason.loggedOut

if(shouldReconnect) {
startBot()
}

}

})

sock.ev.on("creds.update", saveCreds)

// BEM VINDO
sock.ev.on("group-participants.update",
async (anu) => {

try {

const metadata =
await sock.groupMetadata(anu.id)

for(const num of anu.participants) {

if(anu.action === "add") {

await sock.sendMessage(anu.id, {
text: `
👁️ DOMAIN EXPANSION 👁️

⚡ Bem vindo @${num.split("@")[0]}

Prepare-se para o caos do Sukuna 👹

📍 Grupo:
${metadata.subject}
`,
mentions: [num]
})

}

}

} catch(err) {
console.log(err)
}

})

// COMANDOS
sock.ev.on("messages.upsert",
async ({ messages }) => {

const msg = messages[0]

if(!msg.message) return

const from = msg.key.remoteJid

const sender =
msg.key.participant || from

const isGroup =
from.endsWith("@g.us")

const body =
msg.message.conversation ||
msg.message.extendedTextMessage?.text || ""

if(!body.startsWith(prefix)) return

const args =
body.slice(prefix.length).trim().split(/ +/)

const command =
args.shift().toLowerCase()

const isAdmin =
admins.includes(
sender.split("@")[0]
)

const groupMetadata =
isGroup ?
await sock.groupMetadata(from)
: ""

const groupName =
isGroup ?
groupMetadata.subject
: "Privado"

// MENU
if(command === "menu") {

const menu = `
╔══════════════════╗
║ 👁️ GOJO BOT 👁️
╚══════════════════╝

⚡ Usuário:
@${sender.split("@")[0]}

📍 Grupo:
${groupName}

╔═━━━✦ MENU ✦━━━═╗

👑 !grupo abrir
👑 !grupo fechar
💤 !inativos
👥 !marcar
🏓 !ping
🤖 !bot

╚═━━━✦ SUKUNA ✦━━━═╝
`

await sock.sendMessage(from, {
text: menu,
mentions: [sender]
})

}

// PING
if(command === "ping") {

await sock.sendMessage(from, {
text: "🏓 BOT ONLINE ⚡"
})

}

// BOT
if(command === "bot") {

await sock.sendMessage(from, {
text: `
🤖 GOJO BOT ⚡

🔥 Sukuna Mode ON
👁️ Six Eyes Ativado
`
})

}

// MARCAR TODOS
if(command === "marcar") {

if(!isGroup) return

const participantes =
groupMetadata.participants

let texto = "👥 MARCANDO TODOS\n\n"

let mencoes = []

for(let membro of participantes) {

texto += `➤ @${membro.id.split("@")[0]}\n`

mencoes.push(membro.id)

}

await sock.sendMessage(from, {
text: texto,
mentions: mencoes
})

}

// INATIVOS
if(command === "inativos") {

if(!isGroup) return

const participantes =
groupMetadata.participants

let texto =
"💤 LISTA DE MEMBROS\n\n"

let mencoes = []

participantes.forEach((m, i) => {

texto +=
`${i + 1}. @${m.id.split("@")[0]}\n`

mencoes.push(m.id)

})

await sock.sendMessage(from, {
text: texto,
mentions: mencoes
})

}

// ABRIR/FECHAR GRUPO
if(command === "grupo") {

if(!isAdmin)
return sock.sendMessage(from, {
text: "❌ Apenas ADM."
})

if(args[0] === "fechar") {

await sock.groupSettingUpdate(
from,
"announcement"
)

await sock.sendMessage(from, {
text: "🔒 Grupo fechado."
})

}

if(args[0] === "abrir") {

await sock.groupSettingUpdate(
from,
"not_announcement"
)

await sock.sendMessage(from, {
text: "🔓 Grupo aberto."
})

}

}

})

}

startBot()
