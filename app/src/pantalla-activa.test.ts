import { describe, expect, it } from 'vitest'
import {
  PantallaActiva,
  textoPantalla,
  type CentinelaPantalla,
  type ProveedorWakeLock,
} from './pantalla-activa.ts'

class CentinelaFalso implements CentinelaPantalla {
  released = false
  private oyentes: Array<() => void> = []

  release(): Promise<void> {
    this.released = true
    for (const oir of this.oyentes) oir()
    return Promise.resolve()
  }

  addEventListener(_tipo: 'release', fn: () => void): void {
    this.oyentes.push(fn)
  }

  soltarDesdeElSistema(): void {
    this.released = true
    for (const oir of this.oyentes) oir()
  }
}

function proveedor(comportamiento: 'ok' | 'no'): { api: ProveedorWakeLock; centinelas: CentinelaFalso[] } {
  const centinelas: CentinelaFalso[] = []
  return {
    centinelas,
    api: {
      request: (tipo) => {
        expect(tipo).toBe('screen')
        if (comportamiento === 'no') return Promise.reject(new DOMException('no', 'NotAllowedError'))
        const centinela = new CentinelaFalso()
        centinelas.push(centinela)
        return Promise.resolve(centinela)
      },
    },
  }
}

describe('pantalla activa', () => {
  it('dice que no hay API si el navegador no la trae', async () => {
    const cambios: string[] = []
    const pantalla = new PantallaActiva(null, (estado) => cambios.push(textoPantalla(estado)))
    await pantalla.activar()
    expect(cambios.at(-1)).toMatch(/no sostiene/i)
  })

  it('sostiene, se entera si el sistema suelta, y vuelve a pedir', async () => {
    const { api, centinelas } = proveedor('ok')
    const pantalla = new PantallaActiva(api, () => undefined)
    await pantalla.activar()
    expect(pantalla.estado).toBe('sostenida')
    centinelas[0]?.soltarDesdeElSistema()
    expect(pantalla.estado).toBe('suelta')
    await pantalla.alVolverVisible()
    expect(centinelas).toHaveLength(2)
    expect(pantalla.estado).toBe('sostenida')
  })

  it('marca el rechazo y suelta cuando se lo pedimos', async () => {
    const rechazado = proveedor('no')
    const pantalla = new PantallaActiva(rechazado.api, () => undefined)
    await pantalla.activar()
    expect(pantalla.estado).toBe('rechazada')
    expect(textoPantalla(pantalla.estado)).toMatch(/no nos dejó/i)

    const bueno = proveedor('ok')
    const otra = new PantallaActiva(bueno.api, () => undefined)
    await otra.activar()
    await otra.soltar()
    expect(bueno.centinelas[0]?.released).toBe(true)
    expect(otra.estado).toBe('suelta')
    await otra.alVolverVisible()
    expect(bueno.centinelas).toHaveLength(1)
  })
})
