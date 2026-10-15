# Dependencias

Licencias permisivas. No hay YOLO ni código AGPL. No hay runtime de detección en WP1.

Las versiones exactas quedan en `package-lock.json`. La app no llama a analítica ni a una CDN: las fuentes se empaquetan en el build y el service worker solo cachea el mismo origen.

| Paquete | Versión | Uso | Licencia |
| --- | --- | --- | --- |
| typescript | 7.0.2 | Tipos, sin emitir JavaScript | Apache-2.0 |
| vite | 8.3.4 | Dev server y build estático | MIT |
| vitest | 4.1.11 | Pruebas | MIT |
| @types/node | 26.6.5 | Tipos de Node para las pruebas y el build | MIT |
| @fontsource/atkinson-hyperlegible | 5.3.0 | Texto de la interfaz, autoalojado | OFL-1.1 |
| @fontsource/bricolage-grotesque | 5.3.0 | Marca «Fruta», autoalojada | OFL-1.1 |

## Fuentes

- Atkinson Hyperlegible: Copyright 2020 Braille Institute of America. SIL Open Font License 1.1. Elegida para leerse con la luz del súper.
- Bricolage Grotesque: Copyright 2022 The Bricolage Grotesque Project Authors. SIL Open Font License 1.1.

## Modelos

Ninguno en WP1.

## Service worker

Lo genera el build (`vite.config.ts` + `app/src/service-worker.ts`). No usa Workbox ni `storage.googleapis.com`.
