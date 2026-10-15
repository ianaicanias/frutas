export function urlsDetector(base: string): { modelo: string; wasm: string } {
  const normal = base.endsWith('/') ? base : `${base}/`
  return {
    modelo: `${normal}modelos/efficientdet_lite0.tflite`,
    wasm: `${normal}wasm`,
  }
}
