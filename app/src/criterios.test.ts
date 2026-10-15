import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('criterios de WP1', () => {
  it('el manifest se instala en modo standalone', () => {
    const manifest = JSON.parse(readFileSync(join(raiz, 'app/public/manifest.webmanifest'), 'utf8')) as {
      display: string
      start_url: string
      icons: Array<{ src: string }>
    }
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('./')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
    for (const icono of manifest.icons) {
      expect(statSync(join(raiz, 'app/public', icono.src)).isFile()).toBe(true)
    }
  })

  it('el html prepara iPhone: cámara inline, icono y pantalla de inicio', () => {
    const html = readFileSync(join(raiz, 'app/index.html'), 'utf8')
    expect(html).toContain('lang="es-AR"')
    expect(html).toContain('playsinline')
    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('apple-mobile-web-app-capable')
    expect(html).toContain('manifest.webmanifest')
    expect(html).toContain('icono-180.png')
  })

  it('core no importa app y no hay vibración ni YOLO', () => {
    const fuentes = archivosEn(join(raiz, 'app/src'))
      .filter((archivo) => !archivo.endsWith('.test.ts'))
      .map((archivo) => readFileSync(archivo, 'utf8'))
      .join('\n')
    expect(fuentes).not.toMatch(/\.vibrate\s*\(/)
    expect(fuentes).not.toMatch(/ultralytics/i)
    for (const archivo of archivosEn(join(raiz, 'core'))) {
      expect(readFileSync(archivo, 'utf8')).not.toMatch(/from\s+['"][^'"]*\bapp\b/)
    }
  })

  it('el deploy es GitHub Pages con Actions', () => {
    const workflow = readFileSync(join(raiz, '.github/workflows/pages.yml'), 'utf8')
    expect(workflow).toContain('upload-pages-artifact')
    expect(workflow).toContain('deploy-pages')
  })
})

function archivosEn(directorio: string): string[] {
  let entradas: string[]
  try {
    entradas = readdirSync(directorio)
  } catch {
    return []
  }
  const salida: string[] = []
  for (const nombre of entradas) {
    const absoluto = join(directorio, nombre)
    if (statSync(absoluto).isDirectory()) salida.push(...archivosEn(absoluto))
    else if (/\.(ts|tsx|js|mjs|css|html)$/.test(nombre)) salida.push(absoluto)
  }
  return salida
}
