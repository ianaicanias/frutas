# Dependencias

Licencias permisivas. No hay YOLO ni código AGPL.

Las versiones exactas quedan en `package-lock.json`. La app no llama a analítica ni a una CDN: las fuentes, el WASM de MediaPipe y el modelo se empaquetan con el build y se sirven desde el mismo origen. El service worker solo cachea ese origen.

| Paquete | Versión | Uso | Licencia |
| --- | --- | --- | --- |
| typescript | 7.0.2 | Tipos, sin emitir JavaScript | Apache-2.0 |
| vite | 8.3.4 | Dev server y build estático | MIT |
| vitest | 4.1.11 | Pruebas | MIT |
| @types/node | 26.6.5 | Tipos de Node para las pruebas y el build | MIT |
| @fontsource/atkinson-hyperlegible | 5.3.0 | Texto de la interfaz, autoalojado | OFL-1.1 |
| @fontsource/bricolage-grotesque | 5.3.0 | Marca «Fruta», autoalojada | OFL-1.1 |
| @mediapipe/tasks-vision | 1.1.1 | Object Detector en el navegador (WASM / WebGL) | Apache-2.0 |

## Fuentes

- Atkinson Hyperlegible: Copyright 2020 Braille Institute of America. SIL Open Font License 1.1. Elegida para leerse con la luz del súper.
- Bricolage Grotesque: Copyright 2022 The Bricolage Grotesque Project Authors. SIL Open Font License 1.1.

## Modelos

- EfficientDet-Lite0 float16: ver `models/efficientdet_lite0.md`. Apache-2.0. Clase usada: `banana`.

## Service worker

Lo genera el build (`vite.config.ts` + `app/src/service-worker.ts`). No usa Workbox ni `storage.googleapis.com`. El `.wasm` y el `.tflite` no entran en el precache de instalación; se piden al origen cuando carga el detector.
