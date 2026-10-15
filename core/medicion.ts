import { etiquetaDelegado, type Delegado } from './config-detector.ts'

export class AcumuladorMedicion {
  readonly fpsPorSegundo: number[] = []
  readonly latenciasMs: number[] = []
  readonly deteccionesPorCorrida: number[] = []
  private cuadros = 0
  private segundosCerrados = 0

  anotarCuadro(): void {
    this.cuadros += 1
  }

  anotarDeteccion(latenciaMs: number, cantidad: number): void {
    if (Number.isFinite(latenciaMs) && latenciaMs >= 0) this.latenciasMs.push(latenciaMs)
    if (Number.isFinite(cantidad) && cantidad >= 0) this.deteccionesPorCorrida.push(cantidad)
  }

  /** Cierra los segundos ya cumplidos de cámara abierta. El segundo a medias no entra. */
  avanzar(tiempoActivoMs: number): void {
    const cumplidos = Math.max(0, Math.floor(tiempoActivoMs / 1000))
    while (this.segundosCerrados < cumplidos) {
      this.fpsPorSegundo.push(this.cuadros)
      this.cuadros = 0
      this.segundosCerrados += 1
    }
  }
}

export interface DatosMedicion {
  delegado: Delegado
  n: number
  umbral: number
  cargaModeloMs: number
  duracionMs: number
  pausasMs: number
  completa: boolean
  resolucion: string
  fpsPorSegundo: readonly number[]
  latenciasMs: readonly number[]
  deteccionesPorCorrida: readonly number[]
}

export interface ResumenMedicion {
  delegado: string
  n: number
  umbral: number
  cargaModeloMs: number
  duracionMs: number
  pausasMs: number
  completa: boolean
  resolucion: string
  fpsMediano: number | null
  latenciaMedianaMs: number | null
  latenciaP95Ms: number | null
  fpsMinuto1: number | null
  fpsMinuto5: number | null
  segundosMinuto1: number
  segundosMinuto5: number
  deteccionesMedianas: number | null
  fpsPorMinuto: Array<number | null>
}

export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(ordenados.length / 2)
  if (ordenados.length % 2 === 1) return ordenados[medio] ?? null
  const izquierda = ordenados[medio - 1]
  const derecha = ordenados[medio]
  if (izquierda === undefined || derecha === undefined) return null
  return (izquierda + derecha) / 2
}

/** Rango más cercano: el índice es ceil(p/100 * n) - 1. */
export function percentil(valores: readonly number[], p: number): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const indice = Math.min(ordenados.length - 1, Math.max(0, Math.ceil((p / 100) * ordenados.length) - 1))
  return ordenados[indice] ?? null
}

export function resumirMedicion(datos: DatosMedicion): ResumenMedicion {
  const fpsPorMinuto = minutos(datos.fpsPorSegundo)
  return {
    delegado: etiquetaDelegado(datos.delegado),
    n: datos.n,
    umbral: datos.umbral,
    cargaModeloMs: datos.cargaModeloMs,
    duracionMs: datos.duracionMs,
    pausasMs: datos.pausasMs,
    completa: datos.completa,
    resolucion: datos.resolucion,
    fpsMediano: mediana(datos.fpsPorSegundo),
    latenciaMedianaMs: mediana(datos.latenciasMs),
    latenciaP95Ms: percentil(datos.latenciasMs, 95),
    fpsMinuto1: fpsPorMinuto[0] ?? null,
    fpsMinuto5: fpsPorMinuto[4] ?? null,
    segundosMinuto1: tramo(datos.fpsPorSegundo, 0).length,
    segundosMinuto5: tramo(datos.fpsPorSegundo, 4).length,
    deteccionesMedianas: mediana(datos.deteccionesPorCorrida),
    fpsPorMinuto,
  }
}

export function textoResumen(resumen: ResumenMedicion): string {
  const porMinuto = resumen.fpsPorMinuto
    .map((fps, indice) => `${indice + 1}: ${numero(fps, 1)}`)
    .join(' · ')
  return [
    'Medición — detector de banana',
    `Motor: ${resumen.delegado}`,
    'Aviso: en este MediaPipe, GPU es WebGL. No hay delegado WebGPU.',
    `Resolución de la cámara: ${resumen.resolucion}`,
    `N (detecta cada N cuadros): ${resumen.n}`,
    `Confianza mínima: ${numero(resumen.umbral, 2)}`,
    `Carga del modelo: ${numero(resumen.cargaModeloMs, 0)} ms`,
    `Duración con la cámara abierta: ${segundos(resumen.duracionMs)}`,
    `Tiempo oculto, fuera de la medición: ${segundos(resumen.pausasMs)}`,
    `Completa (5 minutos): ${resumen.completa ? 'sí' : 'no'}`,
    `fps mediano: ${numero(resumen.fpsMediano, 1)}`,
    `Latencia mediana: ${numero(resumen.latenciaMedianaMs, 0)} ms`,
    `Latencia p95: ${numero(resumen.latenciaP95Ms, 0)} ms`,
    `fps minuto 1: ${numero(resumen.fpsMinuto1, 1)} (${resumen.segundosMinuto1} s)`,
    `fps minuto 5: ${numero(resumen.fpsMinuto5, 1)} (${resumen.segundosMinuto5} s)`,
    `fps mediano por minuto: ${porMinuto}`,
    `Bananas por pasada del detector (mediana): ${numero(resumen.deteccionesMedianas, 1)}`,
    'Los minutos cuentan solo con la app abierta. El segundo a medias no entra en el fps.',
  ].join('\n')
}

export function textoCuenta(transcurridoMs: number, totalMs: number): string {
  const restante = Math.max(0, Math.ceil((totalMs - transcurridoMs) / 1000))
  const minutos = Math.floor(restante / 60)
  const segs = restante % 60
  return `Midiendo · faltan ${minutos}:${segs.toString().padStart(2, '0')}`
}

function minutos(fps: readonly number[]): Array<number | null> {
  return [0, 1, 2, 3, 4].map((indice) => mediana(tramo(fps, indice)))
}

function tramo(fps: readonly number[], minuto: number): number[] {
  return fps.slice(minuto * 60, (minuto + 1) * 60)
}

function numero(valor: number | null, decimales: number): string {
  if (valor === null || !Number.isFinite(valor)) return 'sin dato'
  return valor.toFixed(decimales).replace('.', ',')
}

function segundos(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return 'sin dato'
  return `${numero(ms / 1000, 1)} s`
}
