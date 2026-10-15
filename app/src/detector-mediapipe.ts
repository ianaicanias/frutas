import { FilesetResolver, ObjectDetector, type Detection, type ObjectDetectorOptions } from '@mediapipe/tasks-vision'
import { CONFIG_DETECTOR, type Delegado } from '../../core/config-detector.ts'
import { deteccionesDesdeCajas, type CajaEnPixeles, type Deteccion } from '../../core/deteccion.ts'

export interface DetectorVideo {
  detectar(
    video: HTMLVideoElement,
    tiempoMs: number,
    frame: { ancho: number; alto: number; numero: number },
  ): Deteccion[]
  cerrar(): void
}

export async function crearDetector(opciones: {
  delegado: Delegado
  urlModelo: string
  urlWasm: string
  lienzoGpu: HTMLCanvasElement
}): Promise<{ detector: DetectorVideo; cargaMs: number }> {
  const inicio = performance.now()
  const wasm = await FilesetResolver.forVisionTasks(opciones.urlWasm)
  const configuracion: ObjectDetectorOptions = {
    baseOptions: {
      modelAssetPath: opciones.urlModelo,
      delegate: opciones.delegado,
    },
    runningMode: 'VIDEO',
    scoreThreshold: CONFIG_DETECTOR.umbralMin,
    categoryAllowlist: [CONFIG_DETECTOR.clase],
  }
  if (opciones.delegado === 'GPU') configuracion.canvas = opciones.lienzoGpu
  const motor = await ObjectDetector.createFromOptions(wasm, configuracion)
  return {
    cargaMs: performance.now() - inicio,
    detector: {
      detectar(video, tiempoMs, frame) {
        const resultado = motor.detectForVideo(video, tiempoMs)
        const cajas = resultado.detections.flatMap(aCaja)
        return deteccionesDesdeCajas(cajas, { ...frame, tiempoMs })
      },
      cerrar() {
        motor.close()
      },
    },
  }
}

function aCaja(deteccion: Detection): CajaEnPixeles[] {
  const caja = deteccion.boundingBox
  if (!caja || deteccion.categories.length === 0) return []
  const mejor = deteccion.categories.reduce((actual, candidato) =>
    candidato.score > actual.score ? candidato : actual,
  )
  return [
    {
      categoria: mejor.categoryName,
      confianza: mejor.score,
      originX: caja.originX,
      originY: caja.originY,
      ancho: caja.width,
      alto: caja.height,
    },
  ]
}
