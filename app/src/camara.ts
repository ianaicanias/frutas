import { planesDeApertura, type PedidoVideo } from './planes-camara.ts'
import type { Resolucion } from './resolucion.ts'

export type LadoCamara = 'trasera' | 'frontal' | 'desconocido'

interface PistaMinima {
  readyState?: MediaStreamTrackState
  muted?: boolean
  getSettings?: () => MediaTrackSettings
}

interface StreamMinimo {
  getVideoTracks(): PistaMinima[]
}

export interface OpcionesApertura {
  contextoSeguro?: boolean
  pedir?: (pedido: PedidoVideo) => Promise<MediaStream>
}

export async function abrirCamara(
  resolucion: Resolucion,
  opciones: OpcionesApertura = {},
): Promise<MediaStream> {
  const contextoSeguro = opciones.contextoSeguro ?? contextoSeguroDelNavegador()
  if (!contextoSeguro) throw crearError('SecurityError', 'Contexto no seguro')

  const pedir = opciones.pedir ?? pedirDelNavegador
  let ultimo: unknown = crearError('NotSupportedError', 'getUserMedia no está')

  for (const pedido of planesDeApertura(resolucion)) {
    try {
      return await pedir(pedido)
    } catch (error) {
      ultimo = error
      if (!esRestriccion(error)) throw error
    }
  }

  throw ultimo
}

export function ladoCamara(stream: StreamMinimo): LadoCamara {
  const modo = stream.getVideoTracks()[0]?.getSettings?.().facingMode
  if (modo === 'environment') return 'trasera'
  if (modo === 'user') return 'frontal'
  return 'desconocido'
}

export function pistaViva(stream: StreamMinimo | null): boolean {
  if (!stream) return false
  const pista = stream.getVideoTracks()[0]
  return !!pista && pista.readyState === 'live' && pista.muted !== true
}

function contextoSeguroDelNavegador(): boolean {
  return typeof window === 'undefined' ? true : window.isSecureContext
}

function pedirDelNavegador(pedido: PedidoVideo): Promise<MediaStream> {
  const media = navigator.mediaDevices
  if (!media?.getUserMedia) {
    return Promise.reject(crearError('NotSupportedError', 'getUserMedia no está'))
  }
  return media.getUserMedia({ video: pedido === true ? true : pedido, audio: false })
}

function esRestriccion(error: unknown): boolean {
  const nombre = error instanceof Error || error instanceof DOMException ? error.name : ''
  return nombre === 'OverconstrainedError' || nombre === 'ConstraintNotSatisfiedError'
}

function crearError(nombre: string, mensaje: string): Error {
  if (typeof DOMException === 'function') return new DOMException(mensaje, nombre)
  const error = new Error(mensaje)
  error.name = nombre
  return error
}
