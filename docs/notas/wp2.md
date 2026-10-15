# Nota WP2 — detector de banana en vivo

## Qué hice

- EfficientDet-Lite0 float16 (COCO, MediaPipe Object Detector) corre en el teléfono. El modelo y el WASM se sirven desde la misma app, sin CDN.
- Solo se dibujan bananas por encima de una confianza configurable. La detección corre cada N cuadros (arranque en 4); las cajas se redibujan en todos los cuadros.
- HUD de depuración: latencia, fps, cantidad, N y tiempo de carga.
- Botón «Medir 5 minutos». Al terminar (o si se corta) se puede copiar o bajar un resumen: fps mediano, latencia mediana y p95, minuto 1 contra minuto 5, carga del modelo.
- Motores: CPU · WASM y GPU · WebGL.

## WebGPU

MediaPipe Tasks Vision 1.1.1 solo acepta delegado `CPU` o `GPU`. GPU en la web es WebGL, no WebGPU. No hay un tercer motor para medir. Quedó dicho en la pantalla y en el resumen, no escondido.

## ¿Reconoce bananas en racimo, apiladas o en cajón?

No lo observé. Esta nota no saca conclusión. Hay que mirarlo en el iPhone con fruta real y anotarlo acá después, como observación.

## Revisión contra AGENTS.md

1. El contrato de detección (caja normalizada, clase, confianza, tiempo, número de cuadro) está en `core/deteccion.ts`. No se cambió el de trazo ni el de reglas: todavía no existen.
2. `core/` no importa `app/` ni MediaPipe.
3. N, umbral, duración y clase viven en `core/config-detector.ts`. La pantalla los lee de ahí. El piso del modelo es el umbral mínimo (0,2) para que el control pueda bajar sin recargar.
4. Licencias en `docs/DEPENDENCIAS.md` y ficha en `models/efficientdet_lite0.md`.
5. iPhone real: no verificado. Abajo.

## Qué no pude verificar en un iPhone real

- 1, 4 y 8 bananas a la vista, ni racimo, pila o cajón.
- Si el motor GPU (WebGL) arranca en Safari o se cae a CPU.
- Los números de los 5 minutos: fps, latencia, minuto 1 contra minuto 5, calentamiento.
- Si las cajas coinciden con la fruta cuando el video está recortado a pantalla completa.
- El copiar al portapapeles y la descarga del resumen en iOS.

En esta máquina corrí las pruebas del filtro, la cadencia, la proyección de las cajas y el resumen. El navegador de escritorio cargó el modelo y una pasada del detector devolvió latencia (0 bananas en un dibujo, no en fruta). Eso no reemplaza la medición del teléfono.

## Deuda técnica

- El service worker no precachea el `.wasm` (~13 MB) ni el `.tflite` (~7 MB) para que la instalación no falle. Los baja la primera vez que se abre el detector y después los puede cachear el fetch.
- WASM de un solo hilo: GitHub Pages no manda los encabezados de aislamiento que harían falta para hilos. La medición del iPhone es con ese WASM, o con WebGL.
- Si el GPU falla, la app lo dice y pasa a CPU. No es silencioso, pero el resumen de esa corrida queda etiquetado como CPU.
