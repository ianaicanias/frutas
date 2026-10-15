import { createHash } from 'node:crypto'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { codigoServiceWorker } from './app/src/service-worker.ts'

const raiz = dirname(fileURLToPath(import.meta.url))
const base = normalizarBase(process.env.BASE_PATH ?? '/')

export default defineConfig({
  root: resolve(raiz, 'app'),
  base,
  publicDir: 'public',
  build: {
    outDir: resolve(raiz, 'dist'),
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [raiz],
    },
  },
  plugins: [
    {
      name: 'fruta-service-worker',
      apply: 'build',
      closeBundle() {
        const dist = resolve(raiz, 'dist')
        const relativos = listar(dist)
          .map((absoluto) => relative(dist, absoluto).replaceAll('\\', '/'))
          .filter(
            (relativo) =>
              relativo !== 'sw.js' &&
              !relativo.endsWith('.map') &&
              !relativo.endsWith('.wasm') &&
              !relativo.endsWith('.tflite'),
          )
        const archivos = relativos.map((relativo) => `${base}${relativo}`)
        const hash = createHash('sha256').update(archivos.join('|')).digest('hex').slice(0, 10)
        writeFileSync(
          join(dist, 'sw.js'),
          codigoServiceWorker({
            cache: `fruta-${hash}`,
            archivos,
            indice: `${base}index.html`,
          }),
        )
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../core/**/*.test.ts'],
  },
})

function normalizarBase(valor: string): string {
  if (valor === '/' || valor === '') return '/'
  const conBarra = valor.endsWith('/') ? valor : `${valor}/`
  return conBarra.startsWith('/') ? conBarra : `/${conBarra}`
}

function listar(directorio: string): string[] {
  const salida: string[] = []
  for (const nombre of readdirSync(directorio)) {
    const absoluto = join(directorio, nombre)
    if (statSync(absoluto).isDirectory()) salida.push(...listar(absoluto))
    else salida.push(absoluto)
  }
  return salida
}
