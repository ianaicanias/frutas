import { describe, expect, it } from 'vitest'
import { abrirCamara, ladoCamara, pistaViva } from './camara.ts'
import { planesDeApertura, type PedidoVideo } from './planes-camara.ts'
import { resolucionPorId } from './resolucion.ts'

describe('planes de apertura', () => {
  it('pide la trasera y no sube de la nitidez elegida', () => {
    const planes = planesDeApertura(resolucionPorId('equilibrada'))
    const primero = planes[0]
    expect(primero).toMatchObject({
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    })
    for (const pedido of planes) {
      if (pedido === true || !('width' in pedido) || !pedido.width || typeof pedido.width === 'number') continue
      expect(pedido.width.ideal).toBeLessThanOrEqual(1280)
    }
    expect(planes.at(-1)).toBe(true)
  })
})

describe('abrir cámara', () => {
  it('no insiste si el permiso está negado', async () => {
    const pedidos: PedidoVideo[] = []
    await expect(
      abrirCamara(resolucionPorId('nitida'), {
        contextoSeguro: true,
        pedir: async (pedido) => {
          pedidos.push(pedido)
          throw new DOMException('no', 'NotAllowedError')
        },
      }),
    ).rejects.toMatchObject({ name: 'NotAllowedError' })
    expect(pedidos).toHaveLength(1)
  })

  it('baja de resolución si la pedida no entra', async () => {
    const anchos: Array<number | 'libre'> = []
    const stream = await abrirCamara(resolucionPorId('nitida'), {
      contextoSeguro: true,
      pedir: async (pedido) => {
        if (pedido === true) {
          anchos.push('libre')
          return {} as MediaStream
        }
        const ancho = typeof pedido.width === 'object' ? pedido.width?.ideal : undefined
        anchos.push(typeof ancho === 'number' ? ancho : 'libre')
        if (ancho !== 640) throw new DOMException('grande', 'OverconstrainedError')
        return {} as MediaStream
      },
    })
    expect(stream).toBeTruthy()
    expect(anchos).toEqual([1920, 1280, 640])
  })

  it('no llama a la cámara fuera de https', async () => {
    let llamadas = 0
    await expect(
      abrirCamara(resolucionPorId('equilibrada'), {
        contextoSeguro: false,
        pedir: async () => {
          llamadas += 1
          return {} as MediaStream
        },
      }),
    ).rejects.toMatchObject({ name: 'SecurityError' })
    expect(llamadas).toBe(0)
  })
})

describe('pista', () => {
  it('distingue trasera, frontal y una pista cortada', () => {
    expect(
      ladoCamara({ getVideoTracks: () => [{ getSettings: () => ({ facingMode: 'environment' }) }] }),
    ).toBe('trasera')
    expect(ladoCamara({ getVideoTracks: () => [{ getSettings: () => ({ facingMode: 'user' }) }] })).toBe(
      'frontal',
    )
    expect(pistaViva({ getVideoTracks: () => [{ readyState: 'live', muted: false }] })).toBe(true)
    expect(pistaViva({ getVideoTracks: () => [{ readyState: 'ended', muted: false }] })).toBe(false)
    expect(pistaViva(null)).toBe(false)
  })
})
