function Duracion(flujos, r) {
  const numerador = flujos.reduce((acc, f, t) => acc + t * (f / Math.pow(1+r, t)), 0);
  const denominador = flujos.reduce((acc, f, t) => acc + (f / Math.pow(1+r, t)), 0);
  return numerador / denominador;
}

function Convexidad(flujos, r) {
  const numerador = flujos.reduce((acc, f, t) => acc + (f * t * (t+1)) / Math.pow(1+r, t+2), 0);
  const denominador = flujos.reduce((acc, f, t) => acc + (f / Math.pow(1+r, t)), 0);
  return numerador / denominador;
}
export { Duracion, Convexidad };