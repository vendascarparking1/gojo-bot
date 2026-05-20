const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")
const readline = require("readline")

const DONO = "989816666909"

let ranking = {}
let atividade = {}

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

async function iniciarBot(){

const { state, saveCreds } =
await useMultiFileAuthState("./auth_info")

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
version,
auth: state,
logger: P({ level:"silent" }),
browser:["GOJO BOT","Chrome","1.0.0"]
})

sock.ev.on("creds.update", saveCreds)

/* CONECTAR VIA CÓDIGO */

if(!sock.authState.creds.registered){

rl.question(
"Digite seu número com DDI:\n",
async(numero)=>{

let codigo =
await sock.requestPairingCode(numero)

codigo = codigo.match(/.{1,4}/g).join("-")

console.log(`
=================================

SEU CÓDIGO:

${codigo}

=================================
`)
})
}

/* CONEXÃO */

sock.ev.on("connection.update",
async(update)=>{

const {
connection,
lastDisconnect
} = update

if(connection === "open"){

console.log("================================")
console.log("BOT ONLINE COM SUCESSO")
console.log("================================")
}

if(connection === "close"){

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode
!== DisconnectReason.loggedOut

if(shouldReconnect){

console.log("Reconectando...")
iniciarBot()
}
}
})

/* BEM VINDO */

sock.ev.on("group-participants.update",
async(data)=>{

try{

const grupo = data.id

for(const user of data.participants){

if(data.action === "add"){

await sock.sendMessage(grupo,{
text:
`🎉 Bem vindo @${user.split("@")[0]}

🔥 Aproveite o grupo
🚫 Sem spam
✅ Respeite todos

Digite:
menu`,
mentions:[user]
})
}

if(data.action === "remove"){

await sock.sendMessage(grupo,{
text:
`😢 @${user.split("@")[0]} saiu do grupo`,
mentions:[user]
})
}
}

}catch(e){

console.log(e)
}
})

/* MENSAGENS */

sock.ev.on("messages.upsert",
async({ messages })=>{

const msg = messages[0]

if(!msg.message) return
if(msg.key.fromMe) return

const texto =
msg.message.conversation ||
msg.message.extendedTextMessage?.text ||
""

const grupo = msg.key.remoteJid
const sender = msg.key.participant || msg.key.remoteJid
const nome = msg.pushName || "Membro"

if(!ranking[sender]) ranking[sender] = 0
ranking[sender]++

atividade[sender] = Date.now()

console.log(nome + ": " + texto)

/* MENU */

if(texto.toLowerCase() === "menu"){

await sock.sendMessage(grupo,{
text:
`📋 *GOJO BOT*

👑 ADM
/add 551199999999
/remove marcar
/promover marcar
/rebaixar marcar

📊 GRUPO
/rank
/inativos
/top

⚡ OUTROS
/ping
/dono`
})
}

/* PING */

if(texto === "/ping"){

await sock.sendMessage(grupo,{
text:"🏓 Pong!"
})
}

/* DONO */

if(texto === "/dono"){

await sock.sendMessage(grupo,{
text:
`👑 Dono:
https://wa.me/${DONO}`
})
}

/* TOP */

if(texto === "/top"){

let top = Object.entries(ranking)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)

let textoTop = "🏆 TOP MEMBROS\n\n"

for(let i = 0; i < top.length; i++){

textoTop +=
`${i+1}° ${top[i][0].split("@")[0]}
💬 ${top[i][1]} mensagens\n\n`
}

await sock.sendMessage(grupo,{
text:textoTop
})
}

/* RANK */

if(texto === "/rank"){

let total = ranking[sender] || 0

await sock.sendMessage(grupo,{
text:
`📊 ${nome}

💬 Mensagens:
${total}`
})
}

/* INATIVOS */

if(texto === "/inativos"){

let agora = Date.now()

let lista = "😴 INATIVOS\n\n"

for(let user in atividade){

let tempo =
(agora - atividade[user]) / 1000 / 60

if(tempo > 60){

lista +=
`@${user.split("@")[0]}
⏰ ${Math.floor(tempo)} minutos\n\n`
}
}

await sock.sendMessage(grupo,{
text:lista,
mentions:Object.keys(atividade)
})
}

/* REMOVER */

if(texto.startsWith("/remove")){

let mention =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"remove"
)
}

/* PROMOVER */

if(texto.startsWith("/promover")){

let mention =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"promote"
)
}

/* REBAIXAR */

if(texto.startsWith("/rebaixar")){

let mention =
msg.message.extendedTextMessage?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"demote"
)
}

/* ADD */

if(texto.startsWith("/add")){

let numero =
texto.replace("/add ","") +
"@s.whatsapp.net"

await sock.groupParticipantsUpdate(
grupo,
[numero],
"add"
)
}

})
}

iniciarBot()
