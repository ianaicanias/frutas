import { describe, expect, it } from 'vitest'
import { planAlVolver } from './reanudacion.ts'

describe('reanudación', () => {
  it('no hace nada mientras la página está oculta', () => {
    expect(
      planAlVolver({ visible: false, pistaViva: false, reintentoAutomaticoAgotado: false }),
    ).toBe('nada')
  })

  it('sigue si la pista sigue viva', () => {
    expect(
      planAlVolver({ visible: true, pistaViva: true, reintentoAutomaticoAgotado: false }),
    ).toBe('ya-activa')
  })

  it('reintenta una vez y después pide un toque', () => {
    expect(
      planAlVolver({ visible: true, pistaViva: false, reintentoAutomaticoAgotado: false }),
    ).toBe('reintentar')
    expect(
      planAlVolver({ visible: true, pistaViva: false, reintentoAutomaticoAgotado: true }),
    ).toBe('pedir-gesto')
  })
})
