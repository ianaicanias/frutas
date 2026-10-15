export function urlServiceWorker(base: string): string {
  const normal = base.endsWith('/') ? base : `${base}/`
  return `${normal}sw.js`
}

/** Service worker local. No referencia CDN ni dominios de terceros. */
export function codigoServiceWorker(opciones: {
  cache: string
  archivos: readonly string[]
  indice: string
}): string {
  return `/* Generado en el build. Cachea la app en el teléfono. */
const CACHE = ${JSON.stringify(opciones.cache)}
const ARCHIVOS = ${JSON.stringify(opciones.archivos)}
const INDICE = ${JSON.stringify(opciones.indice)}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  if (pedido.method !== 'GET') return
  const url = new URL(pedido.url)
  if (url.origin !== self.location.origin) return
  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone()
          caches.open(CACHE).then((cache) => cache.put(pedido, copia))
        }
        return respuesta
      })
      .catch(async () => {
        const guardado = await caches.match(pedido)
        if (guardado) return guardado
        if (pedido.mode === 'navigate') {
          const indice = await caches.match(INDICE)
          if (indice) return indice
        }
        return new Response('Sin conexión', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }),
  )
})
`
}

export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(urlServiceWorker(import.meta.env.BASE_URL), {
      scope: import.meta.env.BASE_URL,
    })
  })
}
