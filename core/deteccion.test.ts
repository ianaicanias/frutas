import { describe, expect, it } from 'vitest'
import { deteccionesDesdeCajas, filtrarDetecciones, type Deteccion } from './deteccion.ts'

const frame = { ancho: 200, alto: 100, tiempoMs: 1200, numero: 8 }

describe('contrato de detección', () => {
  it('normaliza la caja a 0–1 y recorta lo que se sale del cuadro', () => {
    const [deteccion] = deteccionesDesdeCajas(
      [
        {
          categoria: ' banana ',
          confianza: 1.4,
          originX: -20,
          originY: 10,
          ancho: 120,
          alto: 200,
        },
      ],
      frame,
    )
    expect(deteccion).toMatchObject({
      clase: 'banana',
      confianza: 1,
      tiempoCuadroMs: 1200,
      numeroCuadro: 8,
      caja: { x: 0, y: 0.1, ancho: 0.5, alto: 0.9 },
    })
  })

  it('deja solo bananas sobre el umbral', () => {
    const detecciones: Deteccion[] = [
      deteccion('banana', 0.39),
      deteccion('Banana', 0.4),
      deteccion('apple', 0.99),
      deteccion('banana', 0.8),
    ]
    expect(filtrarDetecciones(detecciones, 'banana', 0.4).map((item) => item.confianza)).toEqual([0.4, 0.8])
  })

  it('ignora cajas vacías', () => {
    expect(
      deteccionesDesdeCajas(
        [{ categoria: '  ', confianza: 0.9, originX: 0, originY: 0, ancho: 10, alto: 10 }],
        frame,
      ),
    ).toEqual([])
  })
})

function deteccion(clase: string, confianza: number): Deteccion {
  return {
    clase,
    confianza,
    tiempoCuadroMs: 0,
    numeroCuadro: 0,
    caja: { x: 0, y: 0, ancho: 0.1, alto: 0.1 },
  }
}
