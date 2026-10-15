import { RESOLUCIONES, type Resolucion } from './resolucion.ts'

/** `true` pide la cámara sin restricciones, como último recurso. */
export type PedidoVideo = MediaTrackConstraints | true

/**
 * Primero la nitidez elegida, después las más chicas, y al final sin medida.
 * Nunca pide más pixeles que los elegidos.
 */
export function planesDeApertura(elegida: Resolucion): PedidoVideo[] {
  const menores = RESOLUCIONES.filter(
    (resolucion) => resolucion.ancho <= elegida.ancho && resolucion.alto <= elegida.alto,
  ).sort((a, b) => b.ancho - a.ancho)

  const medidos: PedidoVideo[] = menores.map((resolucion) => ({
    facingMode: { ideal: 'environment' },
    width: { ideal: resolucion.ancho },
    height: { ideal: resolucion.alto },
  }))

  return [...medidos, { facingMode: { ideal: 'environment' } }, true]
}
