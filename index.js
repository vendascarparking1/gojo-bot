const {
default: makeWASocket,
DisconnectReason,
useMultiFileAuthState,
fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const P = require("pino")
const fs = require("fs")
const readline = require("readline")

const DONO = "989816666909"

let ranking = {}
let atividade = {}

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

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

rl.question(
"Digite o número com DDI:\n",
async(numero)=>{

try{

const codigo =
await sock.requestPairingCode(numero)

console.log(`
====================================

CÓDIGO PARA CONECTAR:

${codigo}

====================================
`)

}catch(e){

console.log(e)
}
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

console.log(`
=========================
BOT ONLINE COM SUCESSO
=========================
`)
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

sock.ev.on(
"group-participants.update",
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

const sender =
msg.key.participant ||
msg.key.remoteJid

const nome =
msg.pushName || "Membro"

/* RANK */

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
/remove @membro
/promover @membro
/rebaixar @membro

📊 GRUPO
/top
/rank
/inativos

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

let mensagem =
"🏆 TOP MEMBROS\n\n"

for(let i = 0; i < top.length; i++){

mensagem +=
`${i+1}° @${top[i][0].split("@")[0]}
💬 ${top[i][1]} mensagens\n\n`
}

await sock.sendMessage(grupo,{
text:mensagem,
mentions:top.map(x=>x[0])
})
}

/* RANK */

if(texto === "/rank"){

await sock.sendMessage(grupo,{
text:
`📊 ${nome}

💬 Mensagens:
${ranking[sender]}`
})
}

/* INATIVOS */

if(texto === "/inativos"){

let agora = Date.now()

let lista = "😴 INATIVOS\n\n"

let mentions = []

for(let user in atividade){

let tempo =
(agora - atividade[user]) /
1000 / 60

if(tempo > 60){

lista +=
`@${user.split("@")[0]}
⏰ ${Math.floor(tempo)} minutos\n\n`

mentions.push(user)
}
}

await sock.sendMessage(grupo,{
text:lista,
mentions:mentions
})
}

/* ADD */

if(texto.startsWith("/add")){

if(!grupo.endsWith("@g.us")) return

let numero =
texto.replace("/add ","")
.replace(/\D/g,"")

let jid =
numero + "@s.whatsapp.net"

await sock.groupParticipantsUpdate(
grupo,
[jid],
"add"
)

await sock.sendMessage(grupo,{
text:"✅ Membro adicionado"
})
}

/* REMOVER */

if(texto.startsWith("/remove")){

if(!grupo.endsWith("@g.us")) return

let mention =
msg.message.extendedTextMessage
?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"remove"
)

await sock.sendMessage(grupo,{
text:"✅ Membro removido"
})
}

/* PROMOVER */

if(texto.startsWith("/promover")){

if(!grupo.endsWith("@g.us")) return

let mention =
msg.message.extendedTextMessage
?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"promote"
)

await sock.sendMessage(grupo,{
text:"✅ Agora é ADM"
})
}

/* REBAIXAR */

if(texto.startsWith("/rebaixar")){

if(!grupo.endsWith("@g.us")) return

let mention =
msg.message.extendedTextMessage
?.contextInfo?.mentionedJid

if(!mention) return

await sock.groupParticipantsUpdate(
grupo,
[mention[0]],
"demote"
)

await sock.sendMessage(grupo,{
text:"✅ ADM removido"
})
}

})
}

iniciarBot()
