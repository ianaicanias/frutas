import {
  CONFIG_DETECTOR,
  esDelegado,
  esOpcionN,
  umbralAjustado,
  type Delegado,
  type OpcionN,
} from '../../core/config-detector.ts'

export interface PreferenciasDetector {
  n: OpcionN
  umbral: number
  delegado: Delegado
}

const CLAVE = 'fruta.detector'

export function preferenciasIniciales(): PreferenciasDetector {
  const n = CONFIG_DETECTOR.nInicial
  return {
    n: esOpcionN(n) ? n : 4,
    umbral: CONFIG_DETECTOR.umbralInicial,
    delegado: CONFIG_DETECTOR.delegadoInicial,
  }
}

export function leerPreferencias(almacen: Pick<Storage, 'getItem'> | null): PreferenciasDetector {
  const base = preferenciasIniciales()
  if (!almacen) return base
  try {
    const crudo = almacen.getItem(CLAVE)
    if (!crudo) return base
    const dato = JSON.parse(crudo) as { n?: unknown; umbral?: unknown; delegado?: unknown }
    return {
      n: typeof dato.n === 'number' && esOpcionN(dato.n) ? dato.n : base.n,
      umbral: typeof dato.umbral === 'number' ? umbralAjustado(dato.umbral) : base.umbral,
      delegado: typeof dato.delegado === 'string' && esDelegado(dato.delegado) ? dato.delegado : base.delegado,
    }
  } catch {
    return base
  }
}

export function guardarPreferencias(
  almacen: Pick<Storage, 'setItem'>,
  preferencias: PreferenciasDetector,
): void {
  almacen.setItem(CLAVE, JSON.stringify(preferencias))
}
