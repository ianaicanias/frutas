/** El cuadro 0 detecta. Después, uno de cada `cada` cuadros. */
export function tocaDetectar(numeroCuadro: number, cada: number): boolean {
  const paso = Number.isFinite(cada) && cada >= 1 ? Math.floor(cada) : 1
  if (numeroCuadro < 0) return false
  return numeroCuadro % paso === 0
}
