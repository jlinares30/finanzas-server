import PlanPago from "../models/PlanPago.js";
import Cuota from "../models/Cuota.js";
import EntidadFinanciera from "../models/EntidadFinanciera.js";
import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import Local from "../models/Local.js";
import * as calcular from "../services/FinancialCalculatorService.js";

export const generarPlanPago = async (req, res) => {
  try {
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
    } = req.body;

        // Validar que existe entidad financiera
    const entidad = await EntidadFinanciera.findByPk(entidadFinancieraId);
    if (!entidad) {
      return res.status(404).json({ message: "Entidad financiera no encontrada" });
    }

    // -------------------- 1. Obtener datos del local --------------------
    const local = await Local.findByPk(localId);
    if (!local) return res.status(404).json({ message: "Local no encontrado" });

    // -------------------- 2. Convertir tasas --------------------
    let TEA = tasa_interes_anual;

    if (tipo_tasa === "nominal") {
      const m = capitalizacion === "mensual" ? 12 : 360;
      TEA = calcular.nominalToTEA(tasa_interes_anual, m);
    }

    const TEM = calcular.teaToTEM(TEA);

    // -------------------- 3. Monto financiado --------------------
    const monto_prestamo = precio_venta - cuota_inicial - bono_aplicable;

    // -------------------- 4. Manejo de periodo de gracia --------------------
    let saldo = monto_prestamo;

    if (periodo_gracia > 0) {
      // Gracia total: intereses capitalizados
      saldo = saldo * Math.pow(1 + TEM, periodo_gracia);
    }

    // -------------------- 5. Cuotas totales --------------------
    const cuotas_por_anio = frecuencia_pago === "mensual" ? 12 : 1;
    const total_cuotas = num_anios * cuotas_por_anio;

    // -------------------- 6. Cuota del método francés --------------------
    const cuota_fija = calcular.metodoFrances(saldo, TEM, total_cuotas);

    // -------------------- 7. Generar tabla de amortización --------------------
    let cuotas = [];
    let flujos = [];
    let saldoActual = saldo;

    for (let i = 1; i <= total_cuotas; i++) {
      const interes = saldoActual * TEM;
      const amortizacion = cuota_fija - interes;
      const saldo_final = saldoActual - amortizacion;

      // SEGUROS / COMISIONES (MÍNIMO)
      const seguro_desgravamen = saldoActual * 0.0005;  // EJEMPLO: 0.05%
      const seguro_riesgo = precio_venta * 0.001;        // EJEMPLO: 0.1%
      const comision = 10;                               // EJEMPLO
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
        flujo
      });

      flujos.push(flujo);
      saldoActual = saldo_final;
    }

    // Flujo inicial (desembolso)
    flujos.unshift(monto_prestamo * -1);

    // -------------------- 8. Indicadores financieros --------------------
    const tasa_descuento = TEM;
    const van = calcular.van(flujos, TEM);
    const tir = calcular.tir(flujos);
    const tcea = calcular.TCEA(tir);
    const duracion = calcular.Duracion(flujos, TEM);
    const convexidad = calcular.Convexidad(flujos, TEM);
    // -------------------- 9. Guardar PlanPago --------------------
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
      van,
      tir,
      tcea,
      trea: tir,
      duracion,
      convexidad,
      tasa_interes_anual,
      userId,
      localId
    });

    // -------------------- 10. Guardar cuotas --------------------
    for (const c of cuotas) {
      await Cuota.create({
        ...c,
        planId: plan.id
      });
    }

    // -------------------- 11. Guardar indicadores --------------------
    await IndicadorFinanciero.create({
      tir,
      van,
      tcea,
      trea: tir,
      duracion,
      convexidad,
      tea: TEA,
      tasa_descuento: TEM,
      planId: plan.id
    });

    return res.json({
      message: "Plan de pagos generado correctamente",
      plan,
      cuotas,
      indicadores: { van, tir, tcea, duracion, convexidad }
    });
    
  } catch (error) {
  console.error("Error en generarPlanPago:", error);
  
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ 
      message: "Datos de entrada inválidos",
      errors: error.errors.map(err => err.message)
    });
  }
  
  res.status(500).json({ 
    message: "Error interno al generar plan de pago",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
  }
};
