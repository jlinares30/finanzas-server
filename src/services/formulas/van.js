export function calcularVAN(flujos, tasa) {
  return flujos.reduce(
    (acc, f, t) => acc + f / Math.pow(1 + tasa, t),
    0
  );
}
