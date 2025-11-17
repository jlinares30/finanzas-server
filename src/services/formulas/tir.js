export function calcularTIR(flujos, estimacionInicial = 0.1) {
  const maxIter = 1000;
  const tolerancia = 1e-7;
  let tir = estimacionInicial;

  for (let iter = 0; iter < maxIter; iter++) {
    const van = flujos.reduce((acc, flujo, i) => acc + flujo / Math.pow(1 + tir, i), 0);
    const derivada = flujos.reduce((acc, flujo, i) => acc - (i * flujo) / Math.pow(1 + tir, i + 1), 0);

    const nuevaTir = tir - van / derivada;
    if (Math.abs(nuevaTir - tir) < tolerancia) return nuevaTir;
    tir = nuevaTir;
  }

  return tir;
}
