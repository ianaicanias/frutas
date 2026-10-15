# Nota WP1 — esqueleto y publicación

## Qué hice

- PWA estática (TypeScript + Vite, sin framework) que pide la cámara trasera a pantalla completa, con nitidez configurable (480p, 720p por defecto, 1080p) y la elección guardada en el teléfono.
- Si el permiso falla, no hay cámara o la página no es HTTPS, hay un mensaje en español rioplatense con los pasos. El botón «Reanudar cámara» reintenta.
- Al ocultar la página (bloqueo o cambio de app) se corta la cámara. Al volver se reintenta una vez; si no alcanza, queda el botón.
- Manifest `standalone`, ícono para la pantalla de inicio y service worker del mismo origen (sin CDN).
- Wake Lock pedido, con el resultado visible en la etiqueta. El detalle de iOS está en `docs/wake-lock-ios.md`.
- No hay detección, ni vibración, ni analítica.

## Revisión contra AGENTS.md

1. Contratos de datos: no se implementaron y no se cambiaron. Todavía no hay detecciones ni trazos.
2. `core/` no importa `app/`. En WP1 no tiene código.
3. La nitidez vive en `app/src/resolucion.ts`, se elige en pantalla y se guarda. No hay N, K, umbral ni reglas: eso llega en paquetes posteriores. No hay reglas de fruta hardcodeadas.
4. Dependencias y licencias: `docs/DEPENDENCIAS.md`.
5. iPhone real: no verificado. Detalle abajo.

## Qué no pude verificar en un iPhone real

- Que la URL publicada abra la cámara trasera en un iPhone 13.
- El permiso denegado dentro de Safari y dentro del ícono de inicio (los textos salen de la API, no de una prueba en el aparato).
- Instalar en la pantalla de inicio y que abra en modo standalone.
- Si el Wake Lock deja la pantalla despierta en Safari y, por separado, instalada (en iOS &lt; 18.4 el modo instalado no lo soportaba).
- Si al bloquear o cambiar de app la cámara vuelve sola o hace falta el botón. El código hace las dos cosas, en ese orden.
- Lectura de la etiqueta con luz de súper, con una mano, en el teléfono.

En esta máquina sí corrí las pruebas automáticas, el build y el navegador de escritorio, con el viewport del iPhone 13 (390×844):

- Permiso negado: título «Sin permiso de cámara», pasos para Safari y para el ícono de inicio, y el botón «Reanudar cámara». No queda la pantalla en blanco.
- Cámara simulada: pasa a «Cámara trasera en vivo», pide `facingMode: environment` y, al elegir «Más liviana», reabre en 640×480 y lo recuerda al recargar.
- El service worker queda activo y el manifest está enlazado. En ese navegador el Wake Lock existe pero se rechazó, y la etiqueta dijo «No nos dejó sostener la pantalla».

## Deuda técnica

- El service worker usa red primero y cache de respaldo. No está medido el espacio que iOS le deja a una PWA instalada.
- `pagehide` y `visibilitychange` pueden dispararse juntos; la vuelta se une en un solo intento, pero un iPhone puede portarse distinto.
- La nitidez es un parámetro de plataforma en `app/`, no un archivo de `rules/`. Cuando exista el gobernador (WP9) conviene que lea el mismo dato.
- Publicar exige un repo público: GitHub Pages gratis no cubre un repo privado.

## Publicación

URL prevista: https://ianaicanias.github.io/frutas/

El repo tiene que ser público: GitHub Pages gratis no sirve un repo privado. El primer deploy lo confirma la Action.
