export function TCEA(tirMensual) {
  if (tirMensual === null || !isFinite(tirMensual)) return null;
  return Math.pow(1 + tirMensual, 12) - 1;
}
