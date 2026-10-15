# Proyecto: app web para elegir la fruta más indicada en el súper

## Qué es
Web app instalable (PWA) para iPhone 13 / Safari. El usuario apunta la cámara trasera a varias frutas
(empezamos solo con banana, después palta). La app detecta cada fruta, la sigue en vivo, estima su
estadio de madurez y marca la mejor para el objetivo elegido ("comer hoy", "licuado", "en 3 días").
Aviso = contorno + ícono + texto breve + sonido corto opcional. NO hay vibración (Safari iOS no la soporta).
Todo corre en el teléfono. Sin servidor, sin cuentas, sin cobros. Presupuesto cero.

## Restricciones duras
- Todo gratis. Nada que requiera tarjeta, servicios pagos ni Mac/Xcode.
- Hosting estático con HTTPS (GitHub Pages). La cámara exige contexto seguro.
- Inferencia 100% en el dispositivo. Ningún dato sale del teléfono.
- Licencias permisivas. NO usar YOLO de Ultralytics (AGPL). Registrar cada dependencia y su licencia
  en docs/DEPENDENCIAS.md.
- Stack sugerido: TypeScript + Vite, sin framework pesado. Runtime del detector: MediaPipe Tasks Web
  (Object Detector). Para el clasificador: evaluar MediaPipe vs ONNX Runtime Web y documentar la elección.
  Si preferís otra cosa, justificalo antes de implementar.

## Arquitectura (respetar)
- `app/`   : UI, cámara, audio, instalación (capa de plataforma).
- `core/`  : tracker, suavizado, reglas, ranking, gobernador de rendimiento. NO importa nada de `app/`.
- `models/`: modelos exportados + ficha (origen, licencia, fecha, métricas).
- `rules/` : reglas y objetivos como datos editables (JSON/YAML), versionados. Nunca reglas hardcodeadas.
- `training/`: notebooks y scripts de exportación (Colab/Kaggle).
- `eval/`  : banco de evaluación. Videos pesados fuera del repo, con índice.
- `docs/`  : taxonomía de estadios, decisiones, protocolo de captura.

## Flujo por cuadro
captura → detección cada N cuadros → seguimiento en TODOS los cuadros → clasificación de madurez solo en
recortes nuevos/cambiados o cada K cuadros → suavizado temporal con histéresis → reglas y ranking →
aviso → registro local de métricas.
La fuente de cuadros es intercambiable: cámara en vivo O video grabado, mismo pipeline.

## Contratos de datos (no cambiar sin avisar)
- Detección: caja (x, y, ancho, alto normalizados 0–1), clase, confianza 0–1, tiempo del cuadro (ms), nº de cuadro.
- Trazo: id entero estable, caja, clase, edad en cuadros, veces confirmado por detector, cuadros sin ver,
  probabilidades por estadio, estadio suavizado, confianza suavizada, puntaje para el objetivo, marca "mejor".
- Regla: fruta, estadio, objetivo, puntaje 0–1, texto breve, consejo de guardado, quién la validó, versión.
- Objetivo: id, nombre visible, descripción, ventana en días.
- Taxonomía de estadios (inicial): banana = verde / amarilla firme / con pintas / muy madura;
  palta = dura / lista / pasada.
- Parámetros de rendimiento: N (detección), K (clasificación), resolución de entrada, umbral de confianza,
  tiempo de estabilidad antes de avisar.

## Reglas de trabajo
- Un paquete (WP) por vez. Pruebas automáticas donde se pueda.
- Al terminar cada WP, dejá una nota: qué hiciste, qué NO pudiste verificar en un iPhone real, deuda técnica.
- Si algo de la especificación parece inviable, FRENÁ y avisá en vez de resolverlo en silencio.
- Accesibilidad: el aviso nunca depende solo del color (daltonismo). Sonido silenciable.
- Textos de la UI en español rioplatense.
- Privacidad: nada de analítica de terceros, nada de red salvo cargar la app y los modelos.
