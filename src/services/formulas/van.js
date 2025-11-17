export function calcularVAN(flujos, tasaDescuento) {
  return flujos.reduce((acum, flujo, i) => {
    return acum + flujo / Math.pow(1 + tasaDescuento, i + 1);
  }, 0);
}
