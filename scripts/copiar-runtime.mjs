import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const modelo = join(raiz, 'models/efficientdet_lite0.tflite')
if (!existsSync(modelo)) {
  throw new Error('Falta models/efficientdet_lite0.tflite')
}

const wasmDestino = join(raiz, 'app/public/wasm')
const modeloDestino = join(raiz, 'app/public/modelos')
rmSync(wasmDestino, { recursive: true, force: true })
mkdirSync(wasmDestino, { recursive: true })
mkdirSync(modeloDestino, { recursive: true })
cpSync(join(raiz, 'node_modules/@mediapipe/tasks-vision/wasm'), wasmDestino, { recursive: true })
cpSync(modelo, join(modeloDestino, 'efficientdet_lite0.tflite'))
