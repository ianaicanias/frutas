export interface AvisoCamara {
  titulo: string
  detalle: string
  pasos: string[]
}

export function avisoPorFallo(error: unknown, contextoSeguro: boolean): AvisoCamara {
  if (!contextoSeguro) return avisoHttps()

  switch (nombreDe(error)) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        titulo: 'Sin permiso de cámara',
        detalle: 'El iPhone bloqueó la cámara para esta página.',
        pasos: [
          'En Safari, tocá AA en la barra de dirección → Ajustes del sitio → Cámara → Permitir.',
          'Si no aparece: Ajustes → Safari → Cámara → Permitir o Preguntar, y tocá Reanudar cámara.',
          'Si la abriste desde el ícono de inicio, el permiso es aparte: sacala, aceptá la cámara en Safari y agregala de nuevo.',
        ],
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        titulo: 'No hay cámara',
        detalle: 'Este aparato no tiene una cámara que podamos abrir.',
        pasos: [
          'Probá con el iPhone.',
          'Si hay una funda tapando la lente de atrás, destapala y tocá Reanudar cámara.',
        ],
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        titulo: 'Cámara ocupada',
        detalle: 'Otra app está usando la cámara.',
        pasos: ['Cerrá la otra app.', 'Volvé y tocá Reanudar cámara.'],
      }
    case 'NotSupportedError':
      return {
        titulo: 'Este navegador no abre la cámara',
        detalle: 'Hace falta Safari en el iPhone, con la página en HTTPS.',
        pasos: ['Abrí el enlace publicado en Safari.', 'Si Safari es muy viejo, actualizá el iPhone.'],
      }
    case 'SecurityError':
      return {
        titulo: 'La página no puede usar la cámara',
        detalle: 'El navegador bloqueó la cámara por una política de seguridad.',
        pasos: ['Abrí el enlace publicado en Safari, no una copia embebida.', 'Tocá Reanudar cámara.'],
      }
    case 'AbortError':
      return {
        titulo: 'Se cortó la cámara',
        detalle: 'La apertura se canceló antes de mostrar la imagen.',
        pasos: ['Tocá Reanudar cámara.'],
      }
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return {
        titulo: 'Esa nitidez no entra',
        detalle: 'La cámara no acepta la resolución pedida.',
        pasos: ['Elegí «Más liviana» en Nitidez.', 'Tocá Reanudar cámara.'],
      }
    default: {
      const nombre = nombreDe(error)
      return {
        titulo: 'No se pudo abrir la cámara',
        detalle: nombre
          ? `El navegador respondió «${nombre}».`
          : 'Pasó algo que no reconocemos.',
        pasos: ['Tocá Reanudar cámara.', 'Si sigue igual, cerrá Safari y volvé a entrar.'],
      }
    }
  }
}

function avisoHttps(): AvisoCamara {
  return {
    titulo: 'Hace falta un enlace seguro',
    detalle: 'La cámara solo funciona con HTTPS. Un archivo suelto o un http no alcanzan.',
    pasos: ['Entrá por el enlace publicado: empieza con https.', 'No abras la página desde un archivo local.'],
  }
}

function nombreDe(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string') {
    return error.name
  }
  return ''
}
