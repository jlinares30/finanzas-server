export function calcularTIR(flujos, estimacionInicial = 0.1) {
  const hayCambioDeSigno =
    flujos.some(f => f > 0) && flujos.some(f => f < 0);

  if (!hayCambioDeSigno) {
    return null; // No existe TIR real
  }

  const maxIter = 200;
  const tolerancia = 1e-7;
  let tir = estimacionInicial;

  for (let iter = 0; iter < maxIter; iter++) {
    let van = 0;
    let derivada = 0;

    for (let t = 0; t < flujos.length; t++) {
      const f = flujos[t];
      van += f / Math.pow(1 + tir, t);

      // evitar división por cero
      if (1 + tir === 0) return null;

      derivada -= (t * f) / Math.pow(1 + tir, t + 1);
    }

    // si la derivada es cero: no hay solución usando Newton
    if (Math.abs(derivada) < 1e-12) return null;

    const nuevaTir = tir - van / derivada;

    // evitar valores inválidos
    if (!isFinite(nuevaTir)) return null;
    if (nuevaTir <= -1) return null;

    if (Math.abs(nuevaTir - tir) < tolerancia) return nuevaTir;

    tir = nuevaTir;
  }

  return null;
}
