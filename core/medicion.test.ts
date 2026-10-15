import { describe, expect, it } from 'vitest'
import { AcumuladorMedicion, mediana, percentil, resumirMedicion, textoCuenta, textoResumen } from './medicion.ts'

describe('estadísticas', () => {
  it('calcula mediana y p95', () => {
    expect(mediana([4, 1, 3])).toBe(3)
    expect(mediana([1, 2, 3, 4])).toBe(2.5)
    expect(mediana([])).toBeNull()
    expect(percentil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10)
    expect(percentil([], 95)).toBeNull()
  })
})

describe('medición', () => {
  it('cierra segundos enteros y deja afuera el que está a medias', () => {
    const acumulador = new AcumuladorMedicion()
    for (let i = 0; i < 30; i += 1) acumulador.anotarCuadro()
    acumulador.anotarDeteccion(40, 4)
    acumulador.avanzar(1000)
    for (let i = 0; i < 10; i += 1) acumulador.anotarCuadro()
    acumulador.avanzar(1500)
    expect(acumulador.fpsPorSegundo).toEqual([30])
    expect(acumulador.latenciasMs).toEqual([40])
    acumulador.avanzar(2000)
    expect(acumulador.fpsPorSegundo).toEqual([30, 10])
  })

  it('separa el minuto 1 del minuto 5', () => {
    const fps = Array.from({ length: 300 }, (_, segundo) => (segundo < 60 ? 30 : segundo >= 240 ? 18 : 24))
    const resumen = resumirMedicion({
      delegado: 'CPU',
      n: 4,
      umbral: 0.4,
      cargaModeloMs: 1500,
      duracionMs: 300_000,
      pausasMs: 0,
      completa: true,
      resolucion: '1280×720',
      fpsPorSegundo: fps,
      latenciasMs: [20, 40, 60, 80, 100],
      deteccionesPorCorrida: [1, 4, 8],
    })
    expect(resumen.fpsMinuto1).toBe(30)
    expect(resumen.fpsMinuto5).toBe(18)
    expect(resumen.fpsMediano).toBe(24)
    expect(resumen.latenciaMedianaMs).toBe(60)
    expect(resumen.latenciaP95Ms).toBe(100)
    expect(resumen.deteccionesMedianas).toBe(4)
    expect(resumen.delegado).toBe('CPU · WASM')
    const texto = textoResumen(resumen)
    expect(texto).toContain('fps minuto 1: 30,0 (60 s)')
    expect(texto).toContain('fps minuto 5: 18,0 (60 s)')
    expect(texto).toContain('WebGL')
    expect(texto).not.toMatch(/https?:\/\//)
  })

  it('cuenta regresiva en minutos', () => {
    expect(textoCuenta(0, 300_000)).toBe('Midiendo · faltan 5:00')
    expect(textoCuenta(61_000, 300_000)).toBe('Midiendo · faltan 3:59')
  })
})
