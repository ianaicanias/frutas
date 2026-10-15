# Pantalla encendida en iOS

La app pide `navigator.wakeLock.request('screen')` cuando la cámara arranca, de nuevo en cada toque, y otra vez cuando la página vuelve a verse. Si la API no está o el pedido se rechaza, la etiqueta lo dice. No asumimos que la pantalla quede despierta.

## Qué se sabe de la plataforma

- Safari en iPhone incorpora la Screen Wake Lock API desde iOS 16.4. El iPhone 13 puede tener esa versión o una más nueva. Fuente: [WebKit, Safari 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/).
- En una pestaña de Safari, el pedido puede funcionar. El sistema suelta el bloqueo cuando la página deja de verse (bloqueo de pantalla, cambio de app, ir al inicio). Hay que pedirlo otra vez al volver. Durante un tiempo iOS rechazaba ese segundo pedido si no había un toque fresco ([WebKit 255363](https://bugs.webkit.org/show_bug.cgi?id=255363)); por eso reintentamos también en `pointerdown`.
- Agregada a la pantalla de inicio, la misma API no mantenía la pantalla despierta. Recién iOS 18.4 lo corrigió para las web apps del inicio ([WebKit 254545](https://bugs.webkit.org/show_bug.cgi?id=254545), notas de Safari 18.4). En un iPhone 13 con iOS anterior a 18.4, el modo instalado puede mostrar «No nos dejó sostener la pantalla» aunque en Safari sí funcione.
- Modo de bajo consumo, bloqueo automático del sistema y un pedido rechazado pueden apagar la pantalla igual. La etiqueta muestra el estado real: «Pantalla despierta», «No nos dejó sostener la pantalla» o «Este navegador no sostiene la pantalla».

## Qué no está medido

Esto no se probó en un iPhone 13 físico, ni en Safari ni instalada. Hasta esa prueba, el comportamiento de arriba es documentación de plataforma, no un resultado de este proyecto.
