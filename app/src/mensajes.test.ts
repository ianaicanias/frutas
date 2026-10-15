import { describe, expect, it } from 'vitest'
import { avisoPorFallo } from './mensajes.ts'

describe('aviso de cámara', () => {
  it('explica el https si el contexto no es seguro', () => {
    const aviso = avisoPorFallo(new DOMException('no', 'NotAllowedError'), false)
    expect(aviso.titulo).toMatch(/enlace seguro/i)
    expect(aviso.detalle.toLowerCase()).toContain('https')
    expect(aviso.pasos.length).toBeGreaterThan(0)
  })

  it('explica cómo permitir la cámara en el iPhone', () => {
    const aviso = avisoPorFallo(new DOMException('denied', 'NotAllowedError'), true)
    expect(aviso.titulo).toMatch(/permiso/i)
    expect(aviso.pasos.join(' ')).toMatch(/Safari/)
    expect(aviso.pasos.join(' ')).toMatch(/Reanudar cámara/)
    expect(aviso.pasos.join(' ')).toMatch(/inicio/)
  })

  it('cubre cámara ausente, ocupada y nitidez imposible', () => {
    expect(avisoPorFallo(new DOMException('x', 'NotFoundError'), true).titulo).toMatch(/no hay cámara/i)
    expect(avisoPorFallo(new DOMException('x', 'NotReadableError'), true).titulo).toMatch(/ocupada/i)
    expect(avisoPorFallo(new DOMException('x', 'OverconstrainedError'), true).pasos.join(' ')).toMatch(
      /Más liviana/,
    )
  })

  it('no deja un fallo desconocido sin texto', () => {
    const aviso = avisoPorFallo(new DOMException('raro', 'WeirdError'), true)
    expect(aviso.titulo.length).toBeGreaterThan(0)
    expect(aviso.detalle).toContain('WeirdError')
    expect(aviso.pasos.length).toBeGreaterThan(0)
  })
})
