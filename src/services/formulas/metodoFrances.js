export function metodoFrances(monto, tasa, nPeriodos) {
  const i = tasa / 100;
  return monto * (i / (1 - Math.pow(1 + i, -nPeriodos)));
}
