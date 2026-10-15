import { describe, expect, it } from 'vitest'
import { tocaDetectar } from './cadencia.ts'

describe('cadencia', () => {
  it('detecta el cuadro 0 y después cada N', () => {
    const corridos = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((cuadro) => tocaDetectar(cuadro, 4))
    expect(corridos).toEqual([0, 4, 8])
  })

  it('con N en 1 detecta todos', () => {
    expect([0, 1, 2].every((cuadro) => tocaDetectar(cuadro, 1))).toBe(true)
  })
})
