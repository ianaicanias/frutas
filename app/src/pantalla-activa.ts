export type EstadoPantalla = 'sostenida' | 'sin-api' | 'rechazada' | 'suelta'

export interface CentinelaPantalla {
  released: boolean
  release(): Promise<void>
  addEventListener(tipo: 'release', fn: () => void): void
}

export interface ProveedorWakeLock {
  request(tipo: 'screen'): Promise<CentinelaPantalla>
}

export function textoPantalla(estado: EstadoPantalla): string {
  switch (estado) {
    case 'sostenida':
      return 'Pantalla despierta'
    case 'sin-api':
      return 'Este navegador no sostiene la pantalla'
    case 'rechazada':
      return 'No nos dejó sostener la pantalla'
    case 'suelta':
      return 'La pantalla se puede apagar'
  }
}

export function proveedorWakeLock(): ProveedorWakeLock | null {
  if (typeof navigator === 'undefined') return null
  const candidato = (navigator as Navigator & { wakeLock?: ProveedorWakeLock }).wakeLock
  return candidato ?? null
}

/**
 * Pide que la pantalla no se apague mientras la cámara está en uso.
 * El sistema puede soltar el permiso al ocultar la página; hay que pedirlo de nuevo.
 */
export class PantallaActiva {
  estado: EstadoPantalla
  private querer = false
  private centinela: CentinelaPantalla | null = null
  private cola: Promise<void> = Promise.resolve()

  constructor(
    private readonly proveedor: ProveedorWakeLock | null,
    private readonly alCambiar: (estado: EstadoPantalla) => void,
  ) {
    this.estado = proveedor ? 'suelta' : 'sin-api'
    this.alCambiar(this.estado)
  }

  activar(): Promise<void> {
    this.querer = true
    return this.encolar(() => this.pedir())
  }

  soltar(): Promise<void> {
    this.querer = false
    return this.encolar(() => this.liberar())
  }

  alVolverVisible(): Promise<void> {
    if (!this.querer) return Promise.resolve()
    return this.activar()
  }

  private encolar(tarea: () => Promise<void>): Promise<void> {
    this.cola = this.cola.then(tarea, tarea)
    return this.cola
  }

  private async pedir(): Promise<void> {
    if (!this.proveedor) {
      this.fijar('sin-api')
      return
    }
    if (this.centinela && !this.centinela.released) {
      this.fijar('sostenida')
      return
    }
    try {
      const centinela = await this.proveedor.request('screen')
      if (!this.querer) {
        await centinela.release()
        this.fijar('suelta')
        return
      }
      this.centinela = centinela
      centinela.addEventListener('release', () => {
        if (this.centinela === centinela) this.centinela = null
        if (this.querer) this.fijar('suelta')
      })
      this.fijar('sostenida')
    } catch {
      this.centinela = null
      this.fijar('rechazada')
    }
  }

  private async liberar(): Promise<void> {
    const actual = this.centinela
    this.centinela = null
    if (actual && !actual.released) await actual.release()
    this.fijar(this.proveedor ? 'suelta' : 'sin-api')
  }

  private fijar(estado: EstadoPantalla): void {
    this.estado = estado
    this.alCambiar(estado)
  }
}
