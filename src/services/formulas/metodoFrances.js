/**
 * Calcula cuota fija (método francés) simple
 * monto: numero
 * tasaPeriodo: tasa por periodo (ej: TEM)
 * n: número de cuotas
 */
export function metodoFrances(monto, tasaPeriodo, n) {
  if (tasaPeriodo === 0) return monto / n;
  const numerador = monto * tasaPeriodo;
  const denominador = 1 - Math.pow(1 + tasaPeriodo, -n);
  return numerador / denominador;
}