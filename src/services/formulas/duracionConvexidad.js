export function Duracion(flujos, r) {
  const denom = flujos.reduce((acc, f, t) => acc + f / Math.pow(1+r, t), 0);

  if (denom === 0) return null;

  const numer = flujos.reduce((acc, f, t) => acc + t * (f / Math.pow(1+r, t)), 0);

  return numer / denom;
}

export function Convexidad(flujos, r) {
  const denom = flujos.reduce((acc, f, t) => acc + f / Math.pow(1+r, t), 0);

  if (denom === 0) return null;

  const numer = flujos.reduce(
    (acc, f, t) => acc + (f * t * (t+1)) / Math.pow(1+r, t+2),
    0
  );

  return numer / denom;
}
