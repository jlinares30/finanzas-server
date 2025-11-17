export function metodoFrances(monto, tasaMensual, numCuotas, fechaInicio) {
  const cuota = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -numCuotas));
  let saldo = monto;
  const cuotas = [];

  for (let n = 1; n <= numCuotas; n++) {
    const interes = saldo * tasaMensual;
    const amortizacion = cuota - interes;
    saldo -= amortizacion;

    cuotas.push({
      numero: n,
      cuota: cuota.toFixed(2),
      interes: interes.toFixed(2),
      amortizacion: amortizacion.toFixed(2),
      saldo: saldo.toFixed(2),
    });
  }

  return cuotas;
}
