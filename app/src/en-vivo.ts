import { tocaDetectar } from '../../core/cadencia.ts'
import { CONFIG_DETECTOR, esDelegado, esOpcionN, etiquetaDelegado, type Delegado } from '../../core/config-detector.ts'
import { filtrarDetecciones, type Deteccion } from '../../core/deteccion.ts'
import {
  AcumuladorMedicion,
  resumirMedicion,
  textoCuenta,
  textoResumen,
  type ResumenMedicion,
} from '../../core/medicion.ts'
import { crearDetector, type DetectorVideo } from './detector-mediapipe.ts'
import { dibujarDetecciones, limpiarDetecciones } from './dibujo.ts'
import { guardarPreferencias, leerPreferencias, type PreferenciasDetector } from './preferencias-detector.ts'
import { urlsDetector } from './urls-detector.ts'

export interface SesionDetector {
  suspender(): void
  reanudar(): void
}

export function crearSesionDetector(video: HTMLVideoElement): SesionDetector {
  const canvas = exigir<HTMLCanvasElement>('#cajas')
  const panel = exigir<HTMLElement>('#depuracion')
  const toggle = exigir<HTMLButtonElement>('#toggle-depuracion')
  const lineaDetector = exigir<HTMLElement>('#linea-detector')
  const lineaMedicion = exigir<HTMLElement>('#linea-medicion')
  const carga = exigir<HTMLElement>('#carga-detector')
  const hudLatencia = exigir<HTMLElement>('#hud-latencia')
  const hudFps = exigir<HTMLElement>('#hud-fps')
  const hudCantidad = exigir<HTMLElement>('#hud-cantidad')
  const hudN = exigir<HTMLElement>('#hud-n')
  const hudCarga = exigir<HTMLElement>('#hud-carga')
  const selectN = exigir<HTMLSelectElement>('#cada-n')
  const umbral = exigir<HTMLInputElement>('#umbral')
  const umbralValor = exigir<HTMLElement>('#umbral-valor')
  const selectDelegado = exigir<HTMLSelectElement>('#delegado')
  const medir = exigir<HTMLButtonElement>('#medir')
  const estadoMedicion = exigir<HTMLElement>('#estado-medicion')
  const copiar = exigir<HTMLButtonElement>('#copiar')
  const bajar = exigir<HTMLButtonElement>('#bajar')
  const resumenEl = exigir<HTMLElement>('#resumen')

  const almacen = leerAlmacen()
  const preferencias = leerPreferencias(almacen)
  const lienzoGpu = document.createElement('canvas')
  const urls = urlsDetector(import.meta.env.BASE_URL)

  let detector: DetectorVideo | null = null
  let cargaId = 0
  let cargaMs: number | null = null
  let delegadoEnUso: Delegado = preferencias.delegado
  let numeroCuadro = 0
  let ultimas: Deteccion[] = []
  let ultimaLatencia: number | null = null
  let ultimoTimestamp = 0
  let corriendo = false
  let handle = 0
  let ultimoHud = 0
  const marcasFps: number[] = []

  let midiendo = false
  let inicioMedicion = 0
  let pausasMs = 0
  let pausaDesde: number | null = null
  let acumulador = new AcumuladorMedicion()
  let medicionN: number = preferencias.n
  let medicionUmbral = preferencias.umbral
  let medicionDelegado: Delegado = preferencias.delegado
  let medicionResolucion = 'sin video'
  let textoListo = ''

  armarControles(preferencias)
  toggle.addEventListener('click', () => {
    const mostrar = panel.hidden
    panel.hidden = !mostrar
    toggle.setAttribute('aria-expanded', String(mostrar))
    toggle.textContent = mostrar ? 'Cerrar depuración' : 'Depuración'
  })
  selectN.addEventListener('change', () => {
    recordar()
  })
  umbral.addEventListener('input', () => {
    umbralValor.textContent = Number(umbral.value).toLocaleString('es-AR')
    recordar()
  })
  selectDelegado.addEventListener('change', () => {
    if (!esDelegado(selectDelegado.value)) return
    recordar()
    void cargar(selectDelegado.value)
  })
  medir.addEventListener('click', () => {
    if (midiendo) terminar(false)
    else empezarMedicion()
  })
  copiar.addEventListener('click', () => {
    void copiarResumen()
  })
  bajar.addEventListener('click', () => {
    bajarResumen()
  })

  void cargar(preferencias.delegado)
  reanudar()

  return { suspender, reanudar }

  function armarControles(inicial: PreferenciasDetector): void {
    for (const n of CONFIG_DETECTOR.opcionesN) {
      const opcion = document.createElement('option')
      opcion.value = String(n)
      opcion.textContent = String(n)
      selectN.append(opcion)
    }
    selectN.value = String(inicial.n)
    umbral.min = String(CONFIG_DETECTOR.umbralMin)
    umbral.max = String(CONFIG_DETECTOR.umbralMax)
    umbral.step = String(CONFIG_DETECTOR.umbralPaso)
    umbral.value = String(inicial.umbral)
    umbralValor.textContent = inicial.umbral.toLocaleString('es-AR')
    for (const delegado of ['CPU', 'GPU'] as const) {
      const opcion = document.createElement('option')
      opcion.value = delegado
      opcion.textContent = etiquetaDelegado(delegado)
      selectDelegado.append(opcion)
    }
    selectDelegado.value = inicial.delegado
    medir.disabled = true
  }

  async function cargar(delegado: Delegado, aviso?: string): Promise<void> {
    const yo = ++cargaId
    medir.disabled = true
    carga.hidden = false
    carga.textContent = aviso ?? 'Cargando detector…'
    lineaDetector.hidden = false
    lineaDetector.textContent = 'Cargando detector…'
    try {
      const creado = await crearDetector({
        delegado,
        urlModelo: urls.modelo,
        urlWasm: urls.wasm,
        lienzoGpu,
      })
      if (yo !== cargaId) {
        creado.detector.cerrar()
        return
      }
      detector?.cerrar()
      detector = creado.detector
      cargaMs = creado.cargaMs
      delegadoEnUso = delegado
      ultimoTimestamp = 0
      ultimas = []
      const listo = `Detector listo en ${Math.round(creado.cargaMs).toLocaleString('es-AR')} ms · ${etiquetaDelegado(delegado)}`
      carga.textContent = aviso ?? listo
      lineaDetector.hidden = !aviso
      lineaDetector.textContent = aviso ?? ''
      medir.disabled = false
      hudCarga.textContent = `${Math.round(creado.cargaMs).toLocaleString('es-AR')} ms`
    } catch (error) {
      if (yo !== cargaId) return
      detector?.cerrar()
      detector = null
      if (delegado === 'GPU') {
        selectDelegado.value = 'CPU'
        recordar()
        await cargar('CPU', 'El motor GPU no arrancó. Quedó en CPU · WASM.')
        return
      }
      const detalle = error instanceof Error ? error.message : 'error desconocido'
      const mensaje = `No pude cargar el detector. ${detalle}`
      carga.textContent = mensaje
      lineaDetector.hidden = false
      lineaDetector.textContent = 'No pude cargar el detector. Revisá la conexión y recargá.'
      medir.disabled = true
    }
  }

  function bucle(ahora: number): void {
    if (!corriendo) return
    handle = requestAnimationFrame(bucle)
    marcasFps.push(ahora)
    while (marcasFps.length > 0 && ahora - (marcasFps[0] ?? ahora) > 1000) marcasFps.shift()

    const videoListo = video.readyState >= 2 && video.videoWidth > 0
    if (!videoListo) {
      limpiarDetecciones(canvas)
      ultimas = []
    } else {
      numeroCuadro += 1
      detectarSiToca(ahora)
      dibujarDetecciones(canvas, video, ultimas)
    }

    if (midiendo && pausaDesde === null) {
      const activo = ahora - inicioMedicion - pausasMs
      if (videoListo) acumulador.anotarCuadro()
      acumulador.avanzar(activo)
      lineaMedicion.hidden = false
      lineaMedicion.textContent = textoCuenta(activo, CONFIG_DETECTOR.duracionMedicionMs)
      if (activo >= CONFIG_DETECTOR.duracionMedicionMs) terminar(true)
    }

    if (!panel.hidden && ahora - ultimoHud > 200) {
      ultimoHud = ahora
      hudLatencia.textContent =
        ultimaLatencia === null ? '—' : `${Math.round(ultimaLatencia).toLocaleString('es-AR')} ms`
      hudFps.textContent = String(marcasFps.length)
      hudCantidad.textContent = String(ultimas.length)
      hudN.textContent = String(nActual())
      if (cargaMs !== null) hudCarga.textContent = `${Math.round(cargaMs).toLocaleString('es-AR')} ms`
    }
  }

  function detectarSiToca(ahora: number): void {
    const n = nActual()
    const umbralActual = Number(umbral.value)
    if (!detector || !tocaDetectar(numeroCuadro, n)) return
    const tiempo = timestampVideo(ahora)
    const t0 = performance.now()
    try {
      const crudas = detector.detectar(video, tiempo, {
        ancho: video.videoWidth,
        alto: video.videoHeight,
        numero: numeroCuadro,
      })
      ultimas = filtrarDetecciones(crudas, CONFIG_DETECTOR.clase, umbralActual)
      ultimaLatencia = performance.now() - t0
      if (midiendo) acumulador.anotarDeteccion(ultimaLatencia, ultimas.length)
    } catch (error) {
      ultimaLatencia = performance.now() - t0
      carga.textContent = error instanceof Error ? error.message : 'Falló una detección'
    }
  }

  function empezarMedicion(): void {
    if (!detector) return
    midiendo = true
    inicioMedicion = performance.now()
    pausasMs = 0
    pausaDesde = null
    acumulador = new AcumuladorMedicion()
    medicionN = nActual()
    medicionUmbral = Number(umbral.value)
    medicionDelegado = delegadoEnUso
    medicionResolucion =
      video.videoWidth > 0 ? `${video.videoWidth}×${video.videoHeight}` : 'sin video'
    textoListo = ''
    resumenEl.hidden = true
    copiar.hidden = true
    bajar.hidden = true
    estadoMedicion.textContent = 'Dejá esta pantalla abierta, apuntando a las bananas.'
    medir.textContent = 'Cortar y exportar'
    fijarControles(true)
    lineaMedicion.hidden = false
  }

  function terminar(completa: boolean): void {
    if (!midiendo) return
    const ahora = performance.now()
    if (pausaDesde !== null) {
      pausasMs += ahora - pausaDesde
      pausaDesde = null
    }
    const duracionMs = Math.max(0, ahora - inicioMedicion - pausasMs)
    midiendo = false
    const resumen: ResumenMedicion = resumirMedicion({
      delegado: medicionDelegado,
      n: medicionN,
      umbral: medicionUmbral,
      cargaModeloMs: cargaMs ?? 0,
      duracionMs,
      pausasMs,
      completa,
      resolucion: medicionResolucion,
      fpsPorSegundo: acumulador.fpsPorSegundo,
      latenciasMs: acumulador.latenciasMs,
      deteccionesPorCorrida: acumulador.deteccionesPorCorrida,
    })
    textoListo = textoResumen(resumen)
    resumenEl.textContent = textoListo
    resumenEl.hidden = false
    copiar.hidden = false
    bajar.hidden = false
    copiar.textContent = 'Copiar resumen'
    medir.textContent = 'Medir 5 minutos'
    fijarControles(false)
    estadoMedicion.textContent = completa ? 'Listo. Copiá o bajá el resumen.' : 'Medición cortada. El resumen igual se puede copiar.'
    lineaMedicion.textContent = completa ? 'Medición lista' : 'Medición cortada'
    panel.hidden = false
    toggle.setAttribute('aria-expanded', 'true')
    toggle.textContent = 'Cerrar depuración'
  }

  async function copiarResumen(): Promise<void> {
    if (!textoListo) return
    try {
      await navigator.clipboard.writeText(textoListo)
      copiar.textContent = 'Copiado'
    } catch {
      copiar.textContent = 'No se pudo copiar: seleccioná el texto'
    }
  }

  function bajarResumen(): void {
    if (!textoListo) return
    const blob = new Blob([textoListo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'medicion-fruta.txt'
    enlace.click()
    URL.revokeObjectURL(url)
  }

  function suspender(): void {
    corriendo = false
    cancelAnimationFrame(handle)
    if (midiendo && pausaDesde === null) pausaDesde = performance.now()
    ultimas = []
    limpiarDetecciones(canvas)
  }

  function reanudar(): void {
    if (corriendo) return
    if (midiendo && pausaDesde !== null) {
      pausasMs += performance.now() - pausaDesde
      pausaDesde = null
    }
    corriendo = true
    handle = requestAnimationFrame(bucle)
  }

  function nActual(): number {
    const valor = Number(selectN.value)
    return esOpcionN(valor) ? valor : CONFIG_DETECTOR.nInicial
  }

  function timestampVideo(ahora: number): number {
    const siguiente = Math.max(Math.round(ahora), ultimoTimestamp + 1)
    ultimoTimestamp = siguiente
    return siguiente
  }

  function fijarControles(bloqueado: boolean): void {
    selectN.disabled = bloqueado
    umbral.disabled = bloqueado
    selectDelegado.disabled = bloqueado
  }

  function recordar(): void {
    if (!almacen || midiendo) return
    const n = nActual()
    if (!esOpcionN(n) || !esDelegado(selectDelegado.value)) return
    try {
      guardarPreferencias(almacen, {
        n,
        umbral: Number(umbral.value),
        delegado: selectDelegado.value,
      })
    } catch {
      // Safari privado a veces rechaza localStorage.
    }
  }
}

function leerAlmacen(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function exigir<T extends Element>(selector: string): T {
  const nodo = document.querySelector<T>(selector)
  if (!nodo) throw new Error(`No está ${selector}`)
  return nodo
}
