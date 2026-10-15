export const RESOLUCIONES = [
  { id: 'liviana', etiqueta: 'Más liviana', ancho: 640, alto: 480 },
  { id: 'equilibrada', etiqueta: 'Equilibrada', ancho: 1280, alto: 720 },
  { id: 'nitida', etiqueta: 'Más nítida', ancho: 1920, alto: 1080 },
] as const

export type IdResolucion = (typeof RESOLUCIONES)[number]['id']

export type Resolucion = (typeof RESOLUCIONES)[number]

export const RESOLUCION_INICIAL: IdResolucion = 'equilibrada'

const CLAVE = 'fruta.resolucion'

export function esIdResolucion(valor: string | null): valor is IdResolucion {
  return RESOLUCIONES.some((resolucion) => resolucion.id === valor)
}

export function resolucionPorId(id: IdResolucion): Resolucion {
  const encontrada = RESOLUCIONES.find((resolucion) => resolucion.id === id)
  if (!encontrada) throw new Error(`Resolución desconocida: ${id}`)
  return encontrada
}

export function leerResolucion(almacen: Pick<Storage, 'getItem'> | null): IdResolucion {
  if (!almacen) return RESOLUCION_INICIAL
  const guardada = almacen.getItem(CLAVE)
  return esIdResolucion(guardada) ? guardada : RESOLUCION_INICIAL
}

export function guardarResolucion(almacen: Pick<Storage, 'setItem'>, id: IdResolucion): void {
  almacen.setItem(CLAVE, id)
}
