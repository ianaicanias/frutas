import { describe, expect, it } from 'vitest'
import { guardarPreferencias, leerPreferencias } from './preferencias-detector.ts'

describe('preferencias del detector', () => {
  it('ignora un JSON roto y recuerda lo válido', () => {
    const datos = new Map<string, string>()
    const almacen = {
      getItem: (clave: string) => datos.get(clave) ?? null,
      setItem: (clave: string, valor: string) => {
        datos.set(clave, valor)
      },
    }
    datos.set('fruta.detector', '{')
    expect(leerPreferencias(almacen).n).toBe(4)
    guardarPreferencias(almacen, { n: 3, umbral: 0.55, delegado: 'GPU' })
    expect(leerPreferencias(almacen)).toEqual({ n: 3, umbral: 0.55, delegado: 'GPU' })
    datos.set('fruta.detector', JSON.stringify({ n: 99, umbral: 0.12, delegado: 'WebGPU' }))
    expect(leerPreferencias(almacen)).toMatchObject({ n: 4, umbral: 0.2, delegado: 'CPU' })
  })
})
