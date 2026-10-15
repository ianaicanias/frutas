import { describe, expect, it } from 'vitest'
import {
  RESOLUCION_INICIAL,
  guardarResolucion,
  leerResolucion,
  resolucionPorId,
} from './resolucion.ts'

function memoria() {
  const datos = new Map<string, string>()
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor)
    },
  }
}

describe('resolución', () => {
  it('arranca en 720p si no hay nada guardado', () => {
    expect(leerResolucion(null)).toBe(RESOLUCION_INICIAL)
    expect(resolucionPorId(RESOLUCION_INICIAL)).toMatchObject({ ancho: 1280, alto: 720 })
  })

  it('ignora un valor viejo y recuerda la elección', () => {
    const almacen = memoria()
    almacen.setItem('fruta.resolucion', '4k')
    expect(leerResolucion(almacen)).toBe(RESOLUCION_INICIAL)
    guardarResolucion(almacen, 'liviana')
    expect(leerResolucion(almacen)).toBe('liviana')
    expect(resolucionPorId('liviana').ancho).toBe(640)
  })
})
