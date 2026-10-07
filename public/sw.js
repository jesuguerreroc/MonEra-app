/* Service worker de MonEra: guarda una copia de la app para que abra rápido y sin internet.
 * - Páginas: primero internet (así siempre tienes la última versión); sin conexión, la copia guardada.
 * - Archivos de /assets (llevan un código único por versión): se guardan la primera vez y se reutilizan.
 * - Firebase y demás servicios externos NO pasan por aquí: tus datos van directo a Firebase. */

const SHELL = 'monera-shell-v1'
const ASSETS = 'monera-assets-v1'
const FONTS = 'monera-fonts-v1'
const KEEP = [SHELL, ASSETS, FONTS]
const MAX_ASSETS = 80
const NAV_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(['/', '/manifest.webmanifest', '/favicon.svg', '/pwa-192.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, FONTS))
    return
  }
  if (url.origin !== self.location.origin) return // Firebase, Google, etc.: sin tocar

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, ASSETS, MAX_ASSETS))
  } else {
    event.respondWith(staleWhileRevalidate(req, SHELL))
  }
})

/** Página: intenta internet (máx. 4 s si ya hay copia); si falla, usa la copia guardada de la app. */
async function networkFirstPage(req) {
  const cache = await caches.open(SHELL)
  const cached = await cache.match('/')
  const network = fetch(req).then((res) => {
    if (res.ok) cache.put('/', res.clone())
    return res
  })
  network.catch(() => {}) // si gana la copia guardada, ignora el error posterior
  try {
    if (!cached) return await network
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS)),
    ])
  } catch {
    return cached ?? Response.error()
  }
}

async function cacheFirst(req, name, max) {
  const cache = await caches.open(name)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok || res.type === 'opaque') {
    await cache.put(req, res.clone())
    if (max) trim(cache, max)
  }
  return res
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name)
  const hit = await cache.match(req)
  const network = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone())
    return res
  }).catch(() => hit ?? Response.error())
  return hit ?? network
}

/** Borra los archivos más viejos para que la copia no crezca sin límite con cada versión. */
async function trim(cache, max) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}
