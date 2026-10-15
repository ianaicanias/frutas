import { describe, expect, it } from 'vitest'
import { urlsDetector } from './urls-detector.ts'

describe('urls del detector', () => {
  it('cuelga el modelo y el wasm de la base publicada', () => {
    expect(urlsDetector('/frutas/')).toEqual({
      modelo: '/frutas/modelos/efficientdet_lite0.tflite',
      wasm: '/frutas/wasm',
    })
    expect(urlsDetector('/frutas')).toEqual({
      modelo: '/frutas/modelos/efficientdet_lite0.tflite',
      wasm: '/frutas/wasm',
    })
  })
})
