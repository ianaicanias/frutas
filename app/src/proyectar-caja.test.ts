import { describe, expect, it } from 'vitest'
import { proyectarCajaCover } from './proyectar-caja.ts'

describe('proyección cover', () => {
  it('recorta los costados de un video apaisado en una vista cuadrada', () => {
    const rect = proyectarCajaCover(
      { x: 0.25, y: 0, ancho: 0.5, alto: 1 },
      { ancho: 1000, alto: 500 },
      { ancho: 500, alto: 500 },
    )
    expect(rect.x).toBeCloseTo(0)
    expect(rect.y).toBeCloseTo(0)
    expect(rect.ancho).toBeCloseTo(500)
    expect(rect.alto).toBeCloseTo(500)
  })
})
