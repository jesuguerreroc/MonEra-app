// Conecta el bot de Telegram con la función de Netlify. Se corre UNA vez (y otra si cambias de dominio o de secreto).
//
//   node --env-file=.env.local scripts/telegram-setup.mjs https://tu-sitio.netlify.app
//
// Lee de .env.local: TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET (el mismo secreto que pusiste en Netlify).

const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const site = (process.argv[2] ?? process.env.APP_URL ?? '').replace(/\/+$/, '')

if (!token || !secret || !site.startsWith('https://')) {
  console.error('Uso: node --env-file=.env.local scripts/telegram-setup.mjs https://tu-sitio.netlify.app')
  console.error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_WEBHOOK_SECRET en .env.local, o la URL (debe empezar por https://).')
  process.exit(1)
}

async function call(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(`${method}: ${json.description}`)
  return json.result
}

const me = await call('getMe')
console.log(`Bot: @${me.username}`)

await call('setWebhook', {
  url: `${site}/.netlify/functions/telegram`,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
  max_connections: 10,
})
console.log(`Webhook → ${site}/.netlify/functions/telegram`)

await call('setMyCommands', {
  commands: [
    { command: 'saldo', description: 'Saldo de tus cuentas' },
    { command: 'mes', description: 'Resumen del mes' },
    { command: 'ultimos', description: 'Últimos 5 movimientos' },
    { command: 'deshacer', description: 'Borrar lo último que registraste aquí' },
    { command: 'app', description: 'Abrir Monera' },
    { command: 'ayuda', description: 'Cómo escribir un movimiento' },
    { command: 'desvincular', description: 'Desconectar este chat' },
  ],
})
await call('setMyShortDescription', { short_description: 'Registra gastos e ingresos en Monera escribiendo un mensaje.' })
await call('setMyDescription', {
  description: 'Escribe "25k almuerzo nequi" y queda registrado en Monera. Consulta saldos y el resumen del mes. Conéctalo desde la app: Configuración → Telegram.',
})
console.log('Comandos y descripción listos.')

const info = await call('getWebhookInfo')
if (info.last_error_message) console.log(`Último error del webhook: ${info.last_error_message}`)
console.log(`\nListo. Agrega VITE_TELEGRAM_BOT=${me.username} en Netlify para que la app muestre la opción de conectar.`)
