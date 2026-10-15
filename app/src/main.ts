import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/bricolage-grotesque/latin-700.css'
import './estilos.css'

import { abrirCamara, ladoCamara, pistaViva, type LadoCamara } from './camara.ts'
import { avisoPorFallo } from './mensajes.ts'
import { PantallaActiva, proveedorWakeLock, textoPantalla } from './pantalla-activa.ts'
import { planAlVolver } from './reanudacion.ts'
import {
  RESOLUCIONES,
  esIdResolucion,
  guardarResolucion,
  leerResolucion,
  resolucionPorId,
  type IdResolucion,
} from './resolucion.ts'
import { registrarServiceWorker } from './service-worker.ts'

registrarServiceWorker()

const visor = exigir<HTMLVideoElement>('#visor')
const velo = exigir<HTMLElement>('#velo')
const estado = exigir<HTMLElement>('#estado')
const pip = exigir<HTMLElement>('#pip')
const lineaPantalla = exigir<HTMLElement>('#pantalla')
const aviso = exigir<HTMLElement>('#aviso')
const avisoTitulo = exigir<HTMLElement>('#aviso-titulo')
const avisoDetalle = exigir<HTMLElement>('#aviso-detalle')
const avisoPasos = exigir<HTMLOListElement>('#aviso-pasos')
const reanudar = exigir<HTMLButtonElement>('#reanudar')
const select = exigir<HTMLSelectElement>('#resolucion')

const almacen = leerAlmacen()
let idResolucion: IdResolucion = leerResolucion(almacen)
let stream: MediaStream | null = null
let generacion = 0
let reintentoAgotado = false
let retomando = false

for (const opcion of RESOLUCIONES) {
  const item = document.createElement('option')
  item.value = opcion.id
  item.textContent = `${opcion.etiqueta} · ${opcion.alto}p`
  select.append(item)
}
select.value = idResolucion

const pantalla = new PantallaActiva(proveedorWakeLock(), (actual) => {
  lineaPantalla.textContent = textoPantalla(actual)
})

visor.muted = true
visor.autoplay = true
visor.playsInline = true
visor.disablePictureInPicture = true

function leerAlmacen(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function cerrarStream(): void {
  for (const pista of stream?.getTracks() ?? []) pista.stop()
  stream = null
  visor.srcObject = null
}

function mostrarAbriendo(): void {
  velo.hidden = false
  aviso.hidden = true
  reanudar.hidden = true
  pip.classList.remove('pip--vivo')
  estado.textContent = 'Abriendo la cámara trasera…'
}

function mostrarEnVivo(lado: LadoCamara): void {
  velo.hidden = true
  aviso.hidden = true
  reanudar.hidden = true
  pip.classList.add('pip--vivo')
  estado.textContent =
    lado === 'frontal'
      ? 'Cámara de adelante en vivo'
      : lado === 'trasera'
        ? 'Cámara trasera en vivo'
        : 'Cámara en vivo'
}

function mostrarFallo(error: unknown): void {
  const mensaje = avisoPorFallo(error, window.isSecureContext)
  velo.hidden = false
  aviso.hidden = false
  reanudar.hidden = false
  pip.classList.remove('pip--vivo')
  estado.textContent = 'Cámara detenida'
  avisoTitulo.textContent = mensaje.titulo
  avisoDetalle.textContent = mensaje.detalle
  avisoPasos.replaceChildren()
  for (const paso of mensaje.pasos) {
    const item = document.createElement('li')
    item.textContent = paso
    avisoPasos.append(item)
  }
}

function mostrarReanudar(): void {
  reanudar.hidden = false
  velo.hidden = false
  pip.classList.remove('pip--vivo')
  if (aviso.hidden) estado.textContent = 'Tocá para reanudar la cámara'
}

async function encender(origen: 'auto' | 'gesto'): Promise<void> {
  const yo = ++generacion
  mostrarAbriendo()
  try {
    const nuevo = await abrirCamara(resolucionPorId(idResolucion), {
      contextoSeguro: window.isSecureContext,
    })
    if (yo !== generacion) {
      for (const pista of nuevo.getTracks()) pista.stop()
      return
    }
    cerrarStream()
    stream = nuevo
    visor.srcObject = stream
    await visor.play().catch(() => undefined)
    mostrarEnVivo(ladoCamara(stream))
    const pista = stream.getVideoTracks()[0]
    pista?.addEventListener('ended', () => {
      if (yo !== generacion) return
      alQuedarSinImagen()
    })
    await pantalla.activar()
  } catch (error) {
    if (yo !== generacion) return
    cerrarStream()
    if (origen === 'auto') reintentoAgotado = true
    mostrarFallo(error)
  }
}

function alQuedarSinImagen(): void {
  if (document.visibilityState !== 'visible') return
  if (pistaViva(stream)) return
  if (reintentoAgotado) {
    mostrarReanudar()
    return
  }
  reintentoAgotado = true
  void encender('auto')
}

function alVolver(): void {
  if (retomando) return
  retomando = true
  queueMicrotask(() => {
    retomando = false
  })
  void pantalla.alVolverVisible()
  const plan = planAlVolver({
    visible: document.visibilityState === 'visible',
    pistaViva: pistaViva(stream),
    reintentoAutomaticoAgotado: reintentoAgotado,
  })
  if (plan === 'reintentar') void encender('auto')
  else if (plan === 'pedir-gesto') mostrarReanudar()
}

function alOcultar(): void {
  generacion += 1
  cerrarStream()
  reintentoAgotado = false
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') alOcultar()
  else alVolver()
})

window.addEventListener('pagehide', () => {
  alOcultar()
})

window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) alVolver()
})

reanudar.addEventListener('click', () => {
  reintentoAgotado = false
  void encender('gesto')
})

select.addEventListener('change', () => {
  if (!esIdResolucion(select.value)) return
  idResolucion = select.value
  if (almacen) {
    try {
      guardarResolucion(almacen, idResolucion)
    } catch {
      // Safari en modo privado a veces rechaza localStorage.
    }
  }
  reintentoAgotado = false
  void encender('gesto')
})

// iOS a veces rechaza el wake lock si no hubo un toque, y lo suelta al pasar a otra app.
document.addEventListener('pointerdown', () => {
  void pantalla.activar()
})

void encender('auto')

function exigir<T extends Element>(selector: string): T {
  const nodo = document.querySelector<T>(selector)
  if (!nodo) throw new Error(`No está ${selector}`)
  return nodo
}
