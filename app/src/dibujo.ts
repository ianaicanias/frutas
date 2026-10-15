import type { Deteccion } from '../../core/deteccion.ts'
import { proyectarCajaCover } from './proyectar-caja.ts'

export function dibujarDetecciones(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detecciones: readonly Deteccion[],
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const vista = ajustar(canvas, ctx)
  ctx.clearRect(0, 0, vista.ancho, vista.alto)
  if (video.videoWidth === 0 || video.videoHeight === 0) return
  const videoTamano = { ancho: video.videoWidth, alto: video.videoHeight }
  for (const deteccion of detecciones) {
    const rect = proyectarCajaCover(deteccion.caja, videoTamano, vista)
    trazarCaja(ctx, rect)
    rotular(ctx, rect, vista, `${deteccion.clase} ${Math.round(deteccion.confianza * 100)}%`)
  }
}

export function limpiarDetecciones(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const vista = ajustar(canvas, ctx)
  ctx.clearRect(0, 0, vista.ancho, vista.alto)
}

function ajustar(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { ancho: number; alto: number } {
  const dpr = window.devicePixelRatio || 1
  const ancho = canvas.clientWidth
  const alto = canvas.clientHeight
  const pixelesAncho = Math.max(1, Math.round(ancho * dpr))
  const pixelesAlto = Math.max(1, Math.round(alto * dpr))
  if (canvas.width !== pixelesAncho || canvas.height !== pixelesAlto) {
    canvas.width = pixelesAncho
    canvas.height = pixelesAlto
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ancho, alto }
}

function trazarCaja(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; ancho: number; alto: number },
): void {
  ctx.lineWidth = 3
  ctx.strokeStyle = '#1c2416'
  ctx.strokeRect(rect.x, rect.y, rect.ancho, rect.alto)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#f3e6c4'
  ctx.strokeRect(rect.x + 2, rect.y + 2, Math.max(0, rect.ancho - 4), Math.max(0, rect.alto - 4))
}

function rotular(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number },
  vista: { ancho: number; alto: number },
  texto: string,
): void {
  ctx.font = '700 16px "Atkinson Hyperlegible", sans-serif'
  const ancho = ctx.measureText(texto).width + 12
  const alto = 22
  const x = Math.min(Math.max(4, rect.x), Math.max(4, vista.ancho - ancho - 4))
  const arriba = rect.y > alto + 4
  const y = arriba ? rect.y - alto : Math.min(rect.y, vista.alto - alto - 4)
  ctx.fillStyle = '#f3e6c4'
  ctx.fillRect(x, y, ancho, alto)
  ctx.fillStyle = '#1c2416'
  ctx.fillText(texto, x + 6, y + 16)
}
