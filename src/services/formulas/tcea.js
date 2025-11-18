export function TCEA(tasaMensual) {
  return Math.pow(1 + tasaMensual, 12) - 1;
}
