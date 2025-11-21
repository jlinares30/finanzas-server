import EntidadFinanciera from "../models/EntidadFinanciera.js";
import Local from "../models/Local.js";
import PlanPago from "../models/PlanPago.js";
import User from "../models/User.js";
import Cuota from "../models/Cuota.js";
import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import { FinancialCalculatorService as calcular } from "./FinancialCalculatorService.js";

export const generarPlanPagoService = async (data) => {

  const {
    localId,
    userId,
    entidadFinancieraId,
    precio_venta,
    cuota_inicial,
    bono_aplicable,
    num_anios,
    frecuencia_pago,
    tipo_tasa,
    tasa_interes_anual,
    capitalizacion,
    periodo_gracia
  } = data;

  // -------------------- Validaciones --------------------
  const entidad = await EntidadFinanciera.findByPk(entidadFinancieraId);
  if (!entidad) throw new Error("Entidad financiera no encontrada");

  const local = await Local.findByPk(localId);
  if (!local) throw new Error("Local no encontrado");

  const user = await User.findByPk(userId);
  if (!user) throw new Error("Usuario no encontrado");

  // -------------------- Tasas --------------------
  let TEA = tasa_interes_anual;

  if (tipo_tasa === "nominal") {
    const m = capitalizacion === "mensual" ? 12 : 360;
    TEA = calcular.nominalToTEA(tasa_interes_anual, m);
  }

  const TEM = calcular.teaToTEM(TEA);

  // -------------------- Monto financiado --------------------
  const monto_prestamo = precio_venta - cuota_inicial - bono_aplicable;

  let saldo = monto_prestamo;

  if (periodo_gracia > 0) {
    saldo = saldo * Math.pow(1 + TEM, periodo_gracia);
  }

  const cuotas_por_anio =
    frecuencia_pago === "mensual" ? 12 : 1;

  const total_cuotas = num_anios * cuotas_por_anio;

  const cuota_fija = calcular.metodoFrances(saldo, TEM, total_cuotas);

  // -------------------- Generar cuotas --------------------
  let cuotas = [];
  let flujos = [];
  let saldoActual = saldo;

  for (let i = 1; i <= total_cuotas; i++) {
    const interes = saldoActual * TEM;
    const amortizacion = cuota_fija - interes;
    const saldo_final = saldoActual - amortizacion;

    const seguro_desgravamen = saldoActual * 0.0005;
    const seguro_riesgo = precio_venta * 0.001;
    const comision = 10;
    const portes = 5;
    const gastos_administrativos = 8;

    const flujo = -(cuota_fija + seguro_desgravamen + seguro_riesgo + comision + portes + gastos_administrativos);

    cuotas.push({
      numero: i,
      saldo_inicial: saldoActual,
      saldo_inicial_indexado: saldoActual,
      interes,
      cuota: cuota_fija,
      amortizacion,
      prepago: 0,
      seguro_desgravamen,
      seguro_riesgo,
      comision,
      portes,
      gastos_administrativos,
      saldo_final,
      flujo,
    });

    flujos.push(flujo);
    saldoActual = saldo_final;
  }

  // Flujo inicial
  flujos.unshift(monto_prestamo);

  // -------------------- Indicadores --------------------
  const van = calcular.van(flujos, TEM);
  const tir = calcular.tir(flujos);
  const tcea = calcular.TCEA(tir);
  const duracion = calcular.Duracion(flujos, TEM);
  const convexidad = calcular.Convexidad(flujos, TEM);

  // -------------------- Guardar Plan --------------------
const plan = await PlanPago.create({
  precio_venta,
  cuota_inicial,
  bono_aplicable,
  monto_prestamo,
  num_anios,
  cuotas_por_anio,
  frecuencia_pago,
  total_cuotas,
  dias_por_anio: 360,
  cuota_fija,
  total_intereses: cuotas.reduce((acc, c) => acc + c.interes, 0),
  entidadFinancieraId,
  userId,
  localId
});


  // Registrar cuotas
  for (const c of cuotas) {
    await Cuota.create({
      ...c,
      planId: plan.id,
    });
  }

  // Registrar indicadores financieros
  await IndicadorFinanciero.create({
    tir,
    van,
    tcea,
    trea: tir,
    duracion,
    convexidad,
    tea: TEA,
    tasa_descuento: TEM,
    planId: plan.id,
  });

  return {
    plan,
    cuotas,
    indicadores: { van, tir, tcea, duracion, convexidad },
  };
};
