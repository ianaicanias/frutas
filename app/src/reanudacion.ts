export type PlanReanudacion = 'nada' | 'ya-activa' | 'reintentar' | 'pedir-gesto'

export function planAlVolver(estado: {
  visible: boolean
  pistaViva: boolean
  reintentoAutomaticoAgotado: boolean
}): PlanReanudacion {
  if (!estado.visible) return 'nada'
  if (estado.pistaViva) return 'ya-activa'
  if (!estado.reintentoAutomaticoAgotado) return 'reintentar'
  return 'pedir-gesto'
}
