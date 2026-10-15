import type { Caja } from '../../core/deteccion.ts'

export interface Tamano {
  ancho: number
  alto: number
}

export interface Rect {
  x: number
  y: number
  ancho: number
  alto: number
}

/** object-fit: cover. La caja entra normalizada al cuadro del video. */
export function proyectarCajaCover(caja: Caja, video: Tamano, vista: Tamano): Rect {
  const marco = marcoCover(video, vista)
  return {
    x: caja.x * video.ancho * marco.escala + marco.origenX,
    y: caja.y * video.alto * marco.escala + marco.origenY,
    ancho: caja.ancho * video.ancho * marco.escala,
    alto: caja.alto * video.alto * marco.escala,
  }
}

export function marcoCover(video: Tamano, vista: Tamano): { escala: number; origenX: number; origenY: number } {
  if (video.ancho <= 0 || video.alto <= 0 || vista.ancho <= 0 || vista.alto <= 0) {
    return { escala: 1, origenX: 0, origenY: 0 }
  }
  const escala = Math.max(vista.ancho / video.ancho, vista.alto / video.alto)
  return {
    escala,
    origenX: (vista.ancho - video.ancho * escala) / 2,
    origenY: (vista.alto - video.alto * escala) / 2,
  }
}
