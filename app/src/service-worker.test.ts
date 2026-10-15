import { describe, expect, it } from 'vitest'
import { codigoServiceWorker, urlServiceWorker } from './service-worker.ts'

describe('service worker', () => {
  it('arma la url dentro de la base publicada', () => {
    expect(urlServiceWorker('/frutas/')).toBe('/frutas/sw.js')
    expect(urlServiceWorker('/frutas')).toBe('/frutas/sw.js')
  })

  it('cachea en el origen y no nombra dominios externos', () => {
    const codigo = codigoServiceWorker({
      cache: 'fruta-abc',
      archivos: ['/frutas/index.html', '/frutas/manifest.webmanifest'],
      indice: '/frutas/index.html',
    })
    expect(codigo).toContain('fruta-abc')
    expect(codigo).toContain('/frutas/index.html')
    expect(codigo).not.toMatch(/https?:\/\//)
  })
})
