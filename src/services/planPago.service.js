import { sequelize } from "../config/db.js";
import EntidadFinanciera from "../models/EntidadFinanciera.js";
import Local from "../models/Local.js";
import PlanPago from "../models/PlanPago.js";
import User from "../models/User.js";
import Cuota from "../models/Cuota.js";
import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import CostoInicial from "../models/CostoInicial.js";
import CostoPeriodico from "../models/CostoPeriodico.js";

import { FinancialCalculatorService as calc } from "./FinancialCalculatorService.js";

function round(value, decimals = 2) {
  if (!isFinite(value) || value === null) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
/**
 * Data: objeto con todos los parámetros que se envía desde el controller.
 * Espera:
 *  - localId, userId, entidadFinancieraId
 *  - precio_venta, cuota_inicial, bono_aplicable
 *  - num_anios, frecuencia_pago ("mensual" o "anual")
 *  - tipo_tasa ("nominal" o "efectiva")
 *  - tasa_interes_anual (como 0.12 para 12%)
 *  - capitalizacion (ej "mensual" o número de periodos m)
 *  - tipo_gracia ("SIN_GRACIA","TOTAL","PARCIAL")
 *  - meses_gracia (int)
 */
export async function generarPlanPagoService(data) {
  const t = await sequelize.transaction();
  try {
    // -------------------- EXTRAER Y VALIDAR INPUTS --------------------
    const {
      localId,
      userId,
      entidadFinancieraId,
      precio_venta,
      cuota_inicial = 0,
      bono_aplicable = 0,
      num_anios,
      frecuencia_pago = "mensual",
      tipo_tasa = "efectiva",
      tasa_interes_anual,
      capitalizacion = "mensual",
      tipo_gracia = "SIN_GRACIA",
      meses_gracia = 0,
      moneda = undefined
    } = data;

    // validaciones básicas
    if (!localId || !userId || !entidadFinancieraId) {
      throw new Error("Debe enviarse localId, userId y entidadFinancieraId");
    }
    if (!precio_venta || !num_anios || tasa_interes_anual == null) {
      throw new Error("Datos incompletos: precio_venta, num_anios y tasa_interes_anual son obligatorios");
    }

    const entidad = await EntidadFinanciera.findByPk(entidadFinancieraId);
    if (!entidad) throw new Error("Entidad financiera no encontrada");

    const local = await Local.findByPk(localId);
    if (!local) throw new Error("Local no encontrado");

    const usuario = await User.findByPk(userId);
    if (!usuario) throw new Error("Usuario no encontrado");

    // Traer costos asociados al local (si existen)
    const costoInicial = await CostoInicial.findOne({ where: { localId }});
    const costoPeriodico = await CostoPeriodico.findOne({ where: { localId }});

    // -------------------- TASAS: CONVERTIR A TEA/TEM --------------------
    // se asume tasa_interes_anual en forma decimal (0.12 -> 12%)
    let TEA = tasa_interes_anual;

    if (tipo_tasa && tipo_tasa.toLowerCase() === "nominal") {
      // si capitalizacion es "mensual" o número m
      const m = (capitalizacion === "mensual") ? 12 : (Number(capitalizacion) || 12);
      if (typeof calc.nominalToTEA === "function") {
        TEA = calc.nominalToTEA(tasa_interes_anual, m);
      } else if (typeof calc.convertirTasa === "function") {
        TEA = calc.convertirTasa({ tipo: 'TNA_TO_TEA', tasa: tasa_interes_anual, capitalizaciones: m });
      } else {
        // fallback
        TEA = Math.pow(1 + tasa_interes_anual / m, m) - 1;
      }
    }

    // TEM: tasa por periodo según frecuencia de pago (si mensual)
    const cuotasPorAnio = frecuencia_pago === "mensual" ? 12 : 1;
    let tasaPeriodo;
    if (cuotasPorAnio === 12) {
      tasaPeriodo = (typeof calc.teaToTEM === "function") ? calc.teaToTEM(TEA) : Math.pow(1 + TEA, 1 / 12) - 1;
    } else {
      // anual (o 1) -> tasaPeriodo = TEA
      tasaPeriodo = TEA;
    }

    // -------------------- MONTO FINANCIADO --------------------
    const monto_prestamo = round(precio_venta - cuota_inicial - bono_aplicable, 2);
    if (monto_prestamo <= 0) throw new Error("Monto a financiar debe ser mayor a 0");

    // -------------------- MANEJO DE PERIODO DE GRACIA --------------------
    // Tipo gracia: "SIN_GRACIA", "TOTAL", "PARCIAL"
    let saldoInicial = monto_prestamo;
    const nTotal = num_anios * cuotasPorAnio;
    const mesesGracia = Math.max(0, Number(meses_gracia) || 0);

    // if TOTAL: capitalizamos intereses durante los meses de gracia (intereses añadidos al principal)
    // if PARCIAL: asumimos que durante meses de gracia sólo se pagan intereses (sin amortizar principal)
    // if SIN_GRACIA: nada
    // *Nota*: meses_gracia debe estar en número de periodos (coincide con cuota freq)
    if (tipo_gracia === "TOTAL" && mesesGracia > 0) {
      saldoInicial = saldoInicial * Math.pow(1 + tasaPeriodo, mesesGracia);
    }

    // -------------------- CALCULAR CUOTA FIJA (METODO FRANCES) --------------------
    const totalCuotas = nTotal;
    const cuotaFija = round(calc.metodoFrances(saldoInicial, tasaPeriodo, totalCuotas), 2);

    // -------------------- CONSTRUIR TABLA DE AMORTIZACIÓN Y FLUJOS REALES ----
    const cuotas = [];
    const flujos = [];

    // Primer flujo: desembolso (salida negativa) -> consideramos desembolso neto recibido por cliente:
    // en muchos casos se considera que cliente recibe el préstamo y paga costos iniciales: flujo inicial = - (monto_prestamo - costos_ descontados)
    // Para indicadores conviene considerar flujo0 = - (monto_prestamo - costos_iniciales pagados por cliente)
    let costoInicialTotal = 0;
    if (costoInicial) {
      costoInicialTotal =
        (Number(costoInicial.costes_notariales) || 0) +
        (Number(costoInicial.costes_registrales) || 0) +
        (Number(costoInicial.tasacion) || 0) +
        (Number(costoInicial.comision_estudio) || 0) +
        (Number(costoInicial.comision_activacion) || 0) +
        (Number(costoInicial.seguro_riesgo) || 0);
    }

    // flujo0: desembolso negativo (prestamo pagado al constructor), menos costos iniciales que cliente debe pagar (salida)
    // definimos flujo0 = - monto_prestamo - costos_iniciales (cliente sale con el pago)
    const flujo0 = monto_prestamo - costoInicialTotal;
    flujos.push(flujo0);

    // Generar cuotas periódicas
    let saldo = saldoInicial;

    for (let i = 1; i <= totalCuotas; i++) {
      // Si hay periodo de gracia PARCIAL: durante mesesGracia primeros periodos no amortizas principal (solo pagas interés)
      let interesPeriodo = saldo * tasaPeriodo;
      let amortizacion = cuotaFija - interesPeriodo;
      let cuotaPeriodo = cuotaFija;

      if (tipo_gracia === "PARCIAL" && i <= mesesGracia) {
        // pago de interés solamente -> amortizacion = 0, cuota = interes
        amortizacion = 0;
        cuotaPeriodo = interesPeriodo;
      }
      if (tipo_gracia === "TOTAL" && i <= mesesGracia) {
        // si fue TOTAL y capitalizamos: amortizacion y cuota siguen siendo calculadas con saldoInicial ya aumentado
        // (ya lo modelamos al principio)
      }

      // seguros/comisiones:
      const seguro_desgravamen = (entidad.aplica_seguro_desgravamen) ? (Number(entidad.seguro_desgravamen) || 0) * saldo : 0;
      // entidad puede no tener seguro_desgravamen numérico; asumimos en modelo que entidad no guarda porcentaje, sino booleano.
      // si no está definido, toma 0.

      const seguro_inmueble = (costoPeriodico && Number(costoPeriodico.seguro_contra_todo_riesgo)) || 0;
      const comision_periodica = (costoPeriodico && Number(costoPeriodico.comision_periodica)) || (Number(entidad.comision_mensual) || 0);
      const portes = (costoPeriodico && Number(costoPeriodico.portes)) || 0;
      const gastos_administrativos = (costoPeriodico && Number(costoPeriodico.gastos_administrativos)) || 0;

      // cuota real a pagar = cuotaFija + seguros + comisiones + portes + gastos
      const cuotaReal = -( cuotaFija + seguro_desgravamen + seguro_inmueble + comision_periodica + portes + gastos_administrativos );

      // si PARCIAL y periodo dentro de gracia, cuotaFija usada arriba would be replaced by interes only
      const cuotaPago = (tipo_gracia === "PARCIAL" && i <= mesesGracia) ? -(interesPeriodo + seguro_desgravamen + seguro_inmueble + comision_periodica + portes + gastos_administrativos) : cuotaReal;

      // saldo final si no es periodo parcial de gracia
      if (!(tipo_gracia === "PARCIAL" && i <= mesesGracia)) {
        saldo = round(saldo - amortizacion, 6); // mantener precisión en cálculo interno
      }

      const cuotaObj = {
        numero: i,
        saldo_inicial: round((saldo + amortizacion), 2), // saldo antes de amortizar
        saldo_inicial_indexado: round((saldo + amortizacion), 2),
        interes: round(interesPeriodo, 2),
        cuota: round(Math.abs(cuotaPago), 2),
        amortizacion: round(amortizacion, 2),
        prepago: 0,
        seguro_desgravamen: round(seguro_desgravamen, 2),
        comision: round(comision_periodica, 2),
        saldo_final: round(saldo, 2),
        flujo: round(cuotaPago, 2)
      };

      cuotas.push(cuotaObj);
      // flujos para indicadores: usamos el signo (negativo para salida)
      flujos.push(cuotaObj.flujo);
    }

    // -------------------- INDICADORES FINANCIEROS --------------------
    // Nota: calc.tir espera flujos con signo (primero negativo/positivo)
    const tasaDescPeriodo = tasaPeriodo; // para van se usa tasaPeriodo
    const van = (typeof calc.van === "function") ? round(calc.van(flujos, tasaDescPeriodo), 2) : round(
      flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + tasaDescPeriodo, t), 0), 2
    );

    const tir = (typeof calc.tir === "function") ? calc.tir(flujos) : null;
    const tcea = (typeof calc.TCEA === "function" && tir != null) ? calc.TCEA(tir) : null;
    const duracion = (typeof calc.Duracion === "function") ? calc.Duracion(flujos, tasaDescPeriodo) : null;
    const convexidad = (typeof calc.Convexidad === "function") ? calc.Convexidad(flujos, tasaDescPeriodo) : null;

    // -------------------- GUARDAR EN BD (TRANSACCIÓN) --------------------
    const plan = await PlanPago.create({
      precio_venta,
      cuota_inicial,
      monto_prestamo,
      num_anios,
      cuotas_por_anio: cuotasPorAnio,
      frecuencia_pago,
      total_cuotas: totalCuotas,
      dias_por_anio: 360,
      bono_aplicable,
      cuota_fija: round(cuotaFija, 2),
      total_intereses: round(cuotas.reduce((acc, c) => acc + Number(c.interes || 0), 0), 2),
      moneda: moneda || (entidad.moneda || local.moneda || "PEN"),
      tipo_gracia,
      meses_gracia,
      entidadFinancieraId: entidad.id,
      userId: usuario.id,
      localId: local.id
    }, { transaction: t });

    // create de cuotas
    for (const c of cuotas) {
      await Cuota.create({
        ...c,
        planId: plan.id
      }, { transaction: t });
    }

    // guardar indicadores
    await IndicadorFinanciero.create({
      tir: tir == null ? null : round(tir, 6),
      van: van == null ? null : round(van, 2),
      tcea: tcea == null ? null : round(tcea, 6),
      trea: tir == null ? null : round(tir, 6),
      duracion: duracion == null ? null : round(duracion, 6),
      convexidad: convexidad == null ? null : round(convexidad, 6),
      tea: TEA == null ? null : round(TEA, 6),
      tasa_descuento: tasaDescPeriodo == null ? null : round(tasaDescPeriodo, 6),
      planId: plan.id
    }, { transaction: t });

    await t.commit();

    return {
      plan,
      cuotas,
      indicadores: {
        van,
        tir,
        tcea,
        duracion,
        convexidad
      }
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
