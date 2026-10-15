/** Caja normalizada: origen arriba a la izquierda, valores de 0 a 1 sobre el cuadro. */
export interface Caja {
  x: number
  y: number
  ancho: number
  alto: number
}

/** Contrato de detección. No cambiar los campos sin avisar. */
export interface Deteccion {
  caja: Caja
  clase: string
  confianza: number
  tiempoCuadroMs: number
  numeroCuadro: number
}

export interface CajaEnPixeles {
  categoria: string
  confianza: number
  originX: number
  originY: number
  ancho: number
  alto: number
}

export function deteccionesDesdeCajas(
  cajas: readonly CajaEnPixeles[],
  frame: { ancho: number; alto: number; tiempoMs: number; numero: number },
): Deteccion[] {
  const salida: Deteccion[] = []
  for (const caja of cajas) {
    const clase = caja.categoria.trim()
    if (!clase) continue
    if (caja.ancho <= 0 || caja.alto <= 0) continue
    if (!Number.isFinite(caja.confianza)) continue
    salida.push({
      caja: normalizarCaja(caja, frame.ancho, frame.alto),
      clase,
      confianza: Math.min(1, Math.max(0, caja.confianza)),
      tiempoCuadroMs: frame.tiempoMs,
      numeroCuadro: frame.numero,
    })
  }
  return salida
}

export function normalizarCaja(
  pixeles: { originX: number; originY: number; ancho: number; alto: number },
  anchoFrame: number,
  altoFrame: number,
): Caja {
  if (anchoFrame <= 0 || altoFrame <= 0) return { x: 0, y: 0, ancho: 0, alto: 0 }
  const x = acotar(pixeles.originX / anchoFrame)
  const y = acotar(pixeles.originY / altoFrame)
  const derecha = acotar((pixeles.originX + pixeles.ancho) / anchoFrame)
  const abajo = acotar((pixeles.originY + pixeles.alto) / altoFrame)
  return { x, y, ancho: Math.max(0, derecha - x), alto: Math.max(0, abajo - y) }
}

export function filtrarDetecciones(
  detecciones: readonly Deteccion[],
  clase: string,
  umbral: number,
): Deteccion[] {
  const buscada = clase.trim().toLowerCase()
  return detecciones.filter(
    (deteccion) => deteccion.clase.trim().toLowerCase() === buscada && deteccion.confianza >= umbral,
  )
}

function acotar(valor: number): number {
  if (!Number.isFinite(valor)) return 0
  return Math.min(1, Math.max(0, valor))
}
