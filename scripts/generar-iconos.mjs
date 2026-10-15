import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const salida = join(dirname(fileURLToPath(import.meta.url)), '../app/public/icons')
mkdirSync(salida, { recursive: true })

const hoja = [0x10, 0x20, 0x18, 255]
const etiqueta = [0xf3, 0xe6, 0xc4, 255]
const cascara = [0xe3, 0xb2, 0x3c, 255]
const tallo = [0x1f, 0x5a, 0x38, 255]

const curva = [
  [0.42, 0.34],
  [0.68, 0.46],
  [0.46, 0.7],
]

function bezier(t) {
  const u = 1 - t
  return [
    u * u * curva[0][0] + 2 * u * t * curva[1][0] + t * t * curva[2][0],
    u * u * curva[0][1] + 2 * u * t * curva[1][1] + t * t * curva[2][1],
  ]
}

function distanciaCurva(nx, ny) {
  let minima = Infinity
  for (let i = 0; i <= 96; i += 1) {
    const [x, y] = bezier(i / 96)
    const distancia = Math.hypot(nx - x, ny - y)
    if (distancia < minima) minima = distancia
  }
  return minima
}

function pintar(x, y, size, maskable) {
  const nx = (x + 0.5) / size
  const ny = (y + 0.5) / size
  const rx = maskable ? 0.22 : 0.28
  const ry = maskable ? 0.24 : 0.3
  const elipse = ((nx - 0.5) / rx) ** 2 + ((ny - 0.5) / ry) ** 2
  let color = hoja
  if (elipse <= 1) color = etiqueta
  if (elipse <= 1 && nx < 0.5 - rx * 0.55) color = tallo
  if (elipse <= 1 && distanciaCurva(nx, ny) < (maskable ? 0.042 : 0.05)) color = cascara
  const [sx, sy] = bezier(0)
  if (elipse <= 1 && Math.hypot(nx - (sx - 0.02), ny - (sy - 0.03)) < 0.018) color = tallo
  return color
}

function chunk(tipo, datos) {
  const nombre = Buffer.from(tipo)
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length, 0)
  const cuerpo = Buffer.concat([nombre, datos])
  const suma = Buffer.alloc(4)
  suma.writeUInt32BE(crc32(cuerpo), 0)
  return Buffer.concat([largo, cuerpo, suma])
}

const tabla = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  tabla[n] = c >>> 0
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = tabla[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function png(size, maskable) {
  const rgba = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pintar(x, y, size, maskable)
      const i = (y * size + x) * 4
      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = a
    }
  }
  const crudo = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const fila = y * (size * 4 + 1)
    crudo[fila] = 0
    crudo.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), fila + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(crudo)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync(join(salida, 'icono-180.png'), png(180, false))
writeFileSync(join(salida, 'icono-192.png'), png(192, false))
writeFileSync(join(salida, 'icono-512.png'), png(512, false))
writeFileSync(join(salida, 'icono-512-maskable.png'), png(512, true))
