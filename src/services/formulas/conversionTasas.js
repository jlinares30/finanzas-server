export function nominalToTEA(tasaNominal, m) {
  return Math.pow(1 + tasaNominal / m, m) - 1;
}

//   n: Frecuencia de pagos por año
// n = (12=Mensual, 4=Trimestral, 1=Anual)
export function teaToTEP(tasaEfectivaAnual, n = 12) {
  return Math.pow(1 + tasaEfectivaAnual, 1 / n) - 1;
}