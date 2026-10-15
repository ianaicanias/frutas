import { describe, expect, it } from 'vitest'
import { CONFIG_DETECTOR, esDelegado, esOpcionN, umbralAjustado } from './config-detector.ts'

describe('config del detector', () => {
  it('arranca en un N de 3 a 5 y filtra banana', () => {
    expect(CONFIG_DETECTOR.clase).toBe('banana')
    expect(CONFIG_DETECTOR.nInicial).toBeGreaterThanOrEqual(3)
    expect(CONFIG_DETECTOR.nInicial).toBeLessThanOrEqual(5)
    expect(CONFIG_DETECTOR.opcionesN).toEqual(expect.arrayContaining([3, 4, 5]))
    expect(CONFIG_DETECTOR.duracionMedicionMs).toBe(300_000)
  })

  it('ajusta el umbral al paso y rechaza basura', () => {
    expect(umbralAjustado(0.41)).toBe(0.4)
    expect(umbralAjustado(0.01)).toBe(0.2)
    expect(umbralAjustado(2)).toBe(0.9)
    expect(umbralAjustado(Number.NaN)).toBe(CONFIG_DETECTOR.umbralInicial)
    expect(esOpcionN(4)).toBe(true)
    expect(esOpcionN(7)).toBe(false)
    expect(esDelegado('GPU')).toBe(true)
    expect(esDelegado('WebGPU')).toBe(false)
  })
})
