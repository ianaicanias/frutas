export const CONFIG_DETECTOR = {
  clase: 'banana',
  umbralInicial: 0.4,
  umbralMin: 0.2,
  umbralMax: 0.9,
  umbralPaso: 0.05,
  nInicial: 4,
  opcionesN: [1, 2, 3, 4, 5, 8] as const,
  delegadoInicial: 'CPU' as const,
  duracionMedicionMs: 5 * 60 * 1000,
}

export type Delegado = 'CPU' | 'GPU'
export type OpcionN = (typeof CONFIG_DETECTOR.opcionesN)[number]

export function etiquetaDelegado(delegado: Delegado): string {
  return delegado === 'GPU' ? 'GPU · WebGL' : 'CPU · WASM'
}

export function esDelegado(valor: string | null): valor is Delegado {
  return valor === 'CPU' || valor === 'GPU'
}

export function esOpcionN(valor: number): valor is OpcionN {
  return (CONFIG_DETECTOR.opcionesN as readonly number[]).includes(valor)
}

export function umbralAjustado(valor: number): number {
  if (!Number.isFinite(valor)) return CONFIG_DETECTOR.umbralInicial
  const pasos = Math.round((valor - CONFIG_DETECTOR.umbralMin) / CONFIG_DETECTOR.umbralPaso)
  const ajustado = CONFIG_DETECTOR.umbralMin + pasos * CONFIG_DETECTOR.umbralPaso
  const acotado = Math.min(CONFIG_DETECTOR.umbralMax, Math.max(CONFIG_DETECTOR.umbralMin, ajustado))
  return Number(acotado.toFixed(2))
}
