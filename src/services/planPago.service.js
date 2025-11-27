// src/services/planPago.service.js
import EntidadFinanciera from "../models/EntidadFinanciera.js";
import Local from "../models/Local.js";
import PlanPago from "../models/PlanPago.js";
import User from "../models/User.js";
import Cuota from "../models/Cuota.js";
import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import CostoInicial from "../models/CostoInicial.js";
import CostoPeriodico from "../models/CostoPeriodico.js";
import Socioeconomico from "../models/Socioeconomico.js";
import { sequelize } from "../config/db.js";
import { FinancialCalculatorService as calc } from "./FinancialCalculatorService.js";

/**
 * Helper: safe number
 */
const toNum = (v) => (v == null || v === "" ? 0 : Number(v));

/**
 * Redondeo monetario (2 decimales)
 */
const money = (v) => Number(Number(v).toFixed(2));

/**
 * Devuelve m (capitalizaciones) a partir de capitalization enum o número
 */

const monto_bono_oficial = 46545; // monto oficial del programa BFH/Techo Propio

function getMFromCapitalizacion(cap) {

  if (typeof cap === "number") return cap;

  switch ((cap || "").toString().toLowerCase()) {
    case "mensual":
    case "m":
    case "12":
      return 12;
    case "bimestral":
    case "b":
    case "6":
      return 6;
    case "trimestral":
    case "4":
      return 4;
    case "cuatrimestral":
      return 3;
    case "semestral":
      return 2;
    case "anual":
      return 1;
    case "diaria":
    case "360":
      return 360;
    default:
      return 12;
  }
}

export const generarPlanPagoService = async (data) => {
  const {
    localId,
    userId,
    entidadFinancieraId,
    precio_venta,
    cuota_inicial = 0,
    bono_aplicable = false,
    num_anios,
    frecuencia_pago = "mensual",
    // tipo_tasa: 'EFECTIVA'|'NOMINAL' - si no viene, se toma de la entidad
    tipo_tasa: tipo_tasa_input,
    tasa_interes_anual: tasa_input,
    capitalizacion: capitalizacion_input,
    // tipo de gracia: { tipo: "SIN_GRACIA"|"PARCIAL"|"TOTAL", meses: 0 }
    periodo_gracia = { tipo: "SIN_GRACIA", meses: 0 },
  } = data;

  // -------------------- VALIDACIONES BASICAS --------------------
  if (!localId || !userId || !entidadFinancieraId) {
    throw new Error("Faltan ids obligatorios (localId | userId | entidadFinancieraId).");
  }

  const entidad = await EntidadFinanciera.findByPk(entidadFinancieraId);
  if (!entidad) throw new Error("Entidad financiera no encontrada");

  const local = await Local.findByPk(localId);
  if (!local) throw new Error("Local no encontrado");

  const user = await User.findByPk(userId);
  if (!user) throw new Error("Usuario no encontrado");

  // -------------------- VALIDACIONES MONEDAS -------------------

  const monedaLocal = local.moneda; // 'PEN' | 'USD'
  const monedaBanco = entidad.moneda; // 'PEN' | 'USD'

  if (monedaLocal !== monedaBanco) {
    // Opción B (Pro): Convertir precio_venta usando un tipo de cambio
    const tipoCambio = 3.85;
    precio_venta = monedaLocal === 'USD' ? precio_venta * tipoCambio : precio_venta;
  }

  // -------------------- OBTENER COSTOS DEFINIDOS PARA EL LOCAL --------------------
  const costoInicial = (await CostoInicial.findOne({ where: { localId } })) || null;
  const costoPeriodico = (await CostoPeriodico.findOne({ where: { localId } })) || null;
  const socioeconomico = (await Socioeconomico.findOne({ where: { userId } })) || null;

  // -------------------- DETERMINAR TASAS A USAR --------------------
  // Prioriza los valores pasados en body; si no vienen usa los de la entidad
  const tipo_tasa = tipo_tasa_input ? tipo_tasa_input.toUpperCase() : (entidad.tipo_tasa || "NOMINAL");
  const tasa_origen = tasa_input != null ? toNum(tasa_input) : toNum(entidad.tasa_interes);
  const capitalizacion = capitalizacion_input ?? entidad.capitalizacion ?? 12;

  // --- convertir a TEA (si es necesario) ---
  // asumimos tasa_origen viene en formato decimal (ej: 0.12 para 12%)
  let TEA = tasa_origen;
  if (tipo_tasa === "NOMINAL") {
    // m: número de capitalizaciones por año
    const m = getMFromCapitalizacion(capitalizacion);

    if (!calc.nominalToTEA) throw new Error("Falta función nominalToTEA en FinancialCalculatorService");
    TEA = calc.nominalToTEA(tasa_origen, m); // devuelve decimal (0.125)
  } else {
    // EFECTIVA: aqui se podria necesitar usar frecuencia_efectiva; asumo TEA directa en entidad
    TEA = tasa_origen;
  }

  // --- TEM: tasa por periodo de pago (mensual si frecuencia_pago mensual) ---
  // Normalizamos: frecuencia_pago 'mensual' => periodo mensual
  const periodoPorAnno = frecuencia_pago === "mensual" ? 12 : 1; // si soportas otras frecuencias, ampliar
  // convertimos TEA -> tasa por periodo (TEM)
  if (!calc.teaToTEM) throw new Error("Falta función teaToTEM en FinancialCalculatorService");
  const TEM = calc.teaToTEM(TEA, periodoPorAnno === 12 ? 12 : periodoPorAnno); // la impl puede ignorar 2o arg

  // -------------------- MONTO FINANCIADO / BONO --------------------
  // Validar si entidad permite bono

  let monto_bono = 0;
  if (bono_aplicable) {
    if (!entidad.aplica_bono_techo_propio) {
      throw new Error("Banco no permite BFH/Techo Propio");
    }

    if (socioeconomico.ingresos_mensuales > 3715) {
      throw new Error("No califica por ingresos familiares altos");
    }

    if (precio_venta > 128900) {
      throw new Error("No califica porque el inmueble supera el tope del programa");
    }

    // se aplica monto oficial del programa
    monto_bono = monto_bono_oficial;
  }

  // monto prestamo bruto solicitado (precio - cuota inicial - bono)
  const monto_prestamo_bruto = money(toNum(precio_venta) - toNum(cuota_inicial) - toNum(monto_bono));
  if (monto_prestamo_bruto <= 0) {
    throw new Error("Monto del préstamo inválido o <= 0");
  }

  // -------------------- COSTOS INICIALES (CÓMO LOS TRATAMOS) --------------------
  // Regla (ajustable): 
  // - comision_activacion se financia (se resta del desembolso entregado al cliente)
  // - el resto de costos iniciales (notariales, registrales, tasacion, seguro_riesgo inicial) se pagan al contado por el cliente (se restan del flujo neto recibido)
  const comisionActivacion = costoInicial ? toNum(costoInicial.comision_activacion || 0) : 0;
  const comisionEstudio = costoInicial ? toNum(costoInicial.comision_estudio || 0) : 0;
  const costesNotariales = costoInicial ? toNum(costoInicial.costes_notariales || 0) : 0;
  const costesRegistrales = costoInicial ? toNum(costoInicial.costes_registrales || 0) : 0;
  const tasacion = costoInicial ? toNum(costoInicial.tasacion || 0) : 0;
  const seguroRiesgoInicial = costoInicial ? toNum(costoInicial.seguro_riesgo || 0) : 0;

  // Sumatorias
  const initialCostsPaidByClient = money(costesNotariales + costesRegistrales + tasacion + seguroRiesgoInicial + comisionEstudio);
  const initialCostsFinanced = money(comisionActivacion); // se descuenta del desembolso

  // Nota: ajustar según regla real: algunas entidades descuentan comisiones del préstamo, otras no.

  // -------------------- MONTOS NETOS AL DESEMBOLSO (LO QUE RECIBE CLIENTE) --------------------
  // monto_prestamo_bruto es el monto nominal a financiar (lo que se otorga en el contrato)
  // monto_neto_desembolso = monto prestamo - comisiones descontadas (financed) - otros descuentos aplicables
  const monto_neto_desembolso = money(monto_prestamo_bruto - initialCostsFinanced);

  // -------------------- PERIODOS TOTALES Y MANEJO DE GRACIA --------------------
  const cuotas_por_anio = frecuencia_pago === "mensual" ? 12 : 1;
  const total_cuotas = toNum(num_anios) * cuotas_por_anio;

  // periodo_gracia: { tipo: "SIN_GRACIA"/"PARCIAL"/"TOTAL", meses: n }
  const tipoGracia = (periodo_gracia && periodo_gracia.tipo) ? periodo_gracia.tipo : "SIN_GRACIA";
  const mesesGracia = (periodo_gracia && periodo_gracia.meses) ? toNum(periodo_gracia.meses) : 0;

  // Obtenemos lo que permite el banco (puede ser 'SIN_GRACIA', 'PARCIAL', 'TOTAL' o 'AMBOS')
  const permitidoPorBanco = entidad.periodos_gracia_permitidos;

  // Si el usuario pidió gracia (meses > 0), validamos que el tipo sea correcto
  if (mesesGracia > 0) {
    let esValido = false;

    if (permitidoPorBanco === 'AMBOS') {
      // Si el banco permite AMBOS, el usuario puede pedir TOTAL o PARCIAL
      if (tipoGracia === 'TOTAL' || tipoGracia === 'PARCIAL') esValido = true;
    } else {
      // Si no es AMBOS, debe coincidir exactamente (ej: Banco dice 'TOTAL', usuario pide 'TOTAL')
      if (tipoGracia === permitidoPorBanco) esValido = true;
    }

    if (!esValido) {
      throw new Error(`El banco no permite el tipo de gracia '${tipoGracia}'. Permitido: ${permitidoPorBanco}`);
    }
  }

  if (mesesGracia > (entidad.max_meses_gracia || 0)) {
    throw new Error(`Entidad permite máximo ${entidad.max_meses_gracia || 0} meses de gracia`);
  }

  // Balance inicial sobre el que se calculan cuotas:
  // Si gracia total: intereses capitalizados -> saldo incrementado
  // Si gracia parcial: saldo inicial igual al monto_prestamo_bruto (intereses se pagan durante gracia), cuotas posteriores se calculan sobre saldo original
  let saldoInicialParaAmortizar = monto_prestamo_bruto;
  if (tipoGracia === "TOTAL" && mesesGracia > 0) {
    // capitalizamos intereses por mesesGracia
    saldoInicialParaAmortizar = money(monto_prestamo_bruto * Math.pow(1 + TEM, mesesGracia));
  }

  // Si hay parcial, las cuotas del periodo de gracia serán solo interes + periodic costs (sin amortización)
  const mesesGraciaParcial = tipoGracia === "PARCIAL" ? mesesGracia : 0;
  const mesesGraciaTotal = tipoGracia === "TOTAL" ? mesesGracia : 0;
  const mesesGraciaUsados = mesesGraciaParcial || mesesGraciaTotal || 0;

  // Ajuste del número de cuotas que realmente amortizan:
  const cuotasQueAmortizan = total_cuotas - mesesGraciaUsados;
  if (cuotasQueAmortizan <= 0) {
    throw new Error("Periodo de gracia excede el total de cuotas");
  }

  // -------------------- CALCULO DE CUOTA METODO FRANCES (en periodos que amortizan) --------------------

  // Aseguramos que calc.metodoFrances devuelva cuota fija cuando le pasamos (monto, tasaPeriodo, nCuotas)
  if (!calc.metodoFrances) throw new Error("Falta metodoFrances en FinancialCalculatorService");
  const cuotaFija = money(calc.metodoFrances(saldoInicialParaAmortizar, TEM, cuotasQueAmortizan, /*fechaInicio*/ null));

  // -------------------- COSTOS PERIODICOS (se agregan a cada cuota) --------------------
  const costoPeriodoComision = costoPeriodico ? toNum(costoPeriodico.comision_periodica || 0) : 0;
  const costoPeriodoPortes = costoPeriodico ? toNum(costoPeriodico.portes || 0) : 0;
  const costoPeriodoGastosAdministrativos = costoPeriodico ? toNum(costoPeriodico.gastos_administrativos || 0) : 0;
  // Entidad puede definir comision_mensual, gastos_administrativos
  const entidadComisionMensual = toNum(entidad.comision_mensual || 0);
  const entidadGastosAdministrativos = toNum(entidad.gastos_administrativos || 0);
  // Si entidad aplica seguro desgravamen como porcentaje:
  const aplicaSeguroDesgrav = entidad.aplica_seguro_desgravamen === true;
  const seguroDesgravPorcentaje = toNum(entidad.seguro_desgravamen || 0); // ej 0.0005

  // -------------------- GENERAR TABLAS DE CUOTAS Y FLUJOS --------------------
  // Convention: flujos[0] = monto neto recibido por cliente (positivo), siguientes flujos son negativos (pagos)
  // ------------------------------------------------------------------
  const cuotas = [];
  const flujos = [];

  // Flujo inicial (t=0):
  // consideramos que cliente recibe "monto_neto_desembolso" y en t0 paga initialCostsPaidByClient (si los paga fuera del préstamo).
  // Entonces flujo neto t0 = monto_neto_desembolso - initialCostsPaidByClient
  const flujoInicial = money(monto_neto_desembolso - initialCostsPaidByClient);
  flujos.push(flujoInicial);

  // Si hay meses de gracia total: durante esos meses no hay pagos (o solo costos periódicos si se aplican)
  // Si hay meses de gracia parcial: durante esos meses se paga interés (salarios) + costos periódicos, amortización=0

  // track saldo para amortizacion
  let saldo = saldoInicialParaAmortizar;

  // Si hay "mesesGraciaTotal", en algunos reglamentos evita cualquier pago (pero entidad puede requerir seguros periódicos).
  // En esta implementacion, si hay grace total, el cliente no paga amortizacion ni intereses durante los meses de gracia,
  // pero si hay costos periodicos o seguros periódicos, decidimos que se pueden cobrar (opcional).
  // Aquí implementamos:
  // - Gracia total: intereses capitalizados (ya aplicado), y cobraremos SOLO costos periódicos (si aplica) en cada periodo (opcional).
  // - Gracia parcial: cobramos intereses (saldo*TEM) + costos periódicos en cada periodo, sin amortizacion.

  //--------------- GENERAR MESES DE GRACIA ----------- (si existe)
  for (let g = 1; g <= mesesGraciaUsados; g++) {
    let interes = 0;
    let amortizacion = 0;
    let cuota = 0;

    if (tipoGracia === "TOTAL") {
      // no interesa (ya capitalizado), cuota = costos periodicos si hay (podría ser 0)
      interes = 0;
      amortizacion = 0;
      cuota = 0;
    } else if (tipoGracia === "PARCIAL") {
      // solo intereses
      interes = money(saldo * TEM);
      amortizacion = 0;
      cuota = interes;
    }

    const costoSeguroTodoRiesgo = costoPeriodico ? toNum(costoPeriodico.seguro_contra_todo_riesgo || 0) : 0;
    const seguro_riesgo_periodico = costoSeguroTodoRiesgo;
    // seguros/comisiones/gastos periódicos se suman
    const seguro_desgravamen = aplicaSeguroDesgrav ? money(seguroDesgravPorcentaje * saldo) : 0;
    const comision_total = money(entidadComisionMensual + costoPeriodoComision);
    const portes = money(costoPeriodoPortes);
    const gastosAdmin = money(entidadGastosAdministrativos + costoPeriodoGastosAdministrativos);

    const cuotaTotal = money(cuota + seguro_desgravamen + seguro_riesgo_periodico + comision_total + portes + gastosAdmin);

    // flujo: salida del cliente -> negativo
    flujos.push(-cuotaTotal);

    cuotas.push({
      numero: g,
      saldo_inicial: money(saldo),
      saldo_inicial_indexado: money(saldo),
      interes: money(interes),
      cuota: money(cuotaTotal),
      amortizacion: money(amortizacion),
      prepago: 0,
      seguro_desgravamen: seguro_desgravamen,
      seguro_riesgo: seguro_riesgo_periodico,
      comision: comision_total,
      portes: portes,
      gastos_administrativos: gastosAdmin,
      saldo_final: money(saldo - amortizacion),
      flujo: -cuotaTotal,
    });

    // si parcial: saldo no cambia; si total: saldo no cambia (capitalizado ya)
  }

  //------------------- GENERA CUOTAS QUE AMORTIZAN (restantes)----------------------
  for (let i = 1; i <= cuotasQueAmortizan; i++) {
    const periodo = mesesGraciaUsados + i;
    const interes = money(saldo * TEM);
    const amortizacion = money(cuotaFija - interes);
    // en edge cases amortizacion puede ser negativo si cuotaFija < interes -> validar
    const saldo_final = money(saldo - amortizacion);

    const seguro_desgravamen = aplicaSeguroDesgrav ? money(seguroDesgravPorcentaje * saldo) : 0;
    const seguro_riesgo_periodico = toNum(entidad.seguro_inmueble || 0);
    const comision_total = money(entidadComisionMensual + costoPeriodoComision);
    const portes = money(costoPeriodoPortes);
    const gastosAdmin = money(entidadGastosAdministrativos + costoPeriodoGastosAdministrativos);

    const cuotaTotal = money(cuotaFija + seguro_desgravamen + seguro_riesgo_periodico + comision_total + portes + gastosAdmin);

    flujos.push(-cuotaTotal);

    cuotas.push({
      numero: periodo,
      saldo_inicial: money(saldo),
      saldo_inicial_indexado: money(saldo),
      interes: money(interes),
      cuota: money(cuotaTotal),
      amortizacion: money(amortizacion),
      prepago: 0,
      seguro_desgravamen,
      seguro_riesgo: seguro_riesgo_periodico,
      comision: comision_total,
      portes,
      gastos_administrativos: gastosAdmin,
      saldo_final,
      flujo: -cuotaTotal,
    });

    saldo = saldo_final;
  }

  // Enfoque: flujos[] = [t0, t1, t2, ...] con t0 positivo (lo que recibió el cliente), siguientes negativos (pagos)
  // -------------------- CALCULO INDICADORES FINANCIEROS --------------------
  // VAN: usamos tasa de descuento igual a TEM (se puede adaptar a otra tasa)
  const tasa_descuento_periodica = TEM; // por periodo
  let van = null;
  let tir = null;
  let tcea = null;
  let duracion = null;
  let convexidad = null;

  try {

    if (!calc.van || !calc.tir || !calc.TCEA || !calc.Duracion || !calc.Convexidad) {
      throw new Error("Faltan funciones financieras en FinancialCalculatorService (van, tir, TCEA, Duracion, Convexidad)");
    }

    // VAN: convención: van(flujos, tasaPeriodo).
    van = money(calc.van(flujos, tasa_descuento_periodica));

    // TIR: la función espera flujos (con signo). Puede devolver null si no existe.
    tir = calc.tir(flujos);
    if (tir == null || !isFinite(tir)) {
      tir = null;
      tcea = null;
    } else {
      // convertir a TCEA anual
      tcea = money(calc.TCEA(tir));
    }

    // Duracion / Convexidad: si calc asume r como tasa periódica (p. ej. TEM), usar TEM o tir según convención
    // Normalmente usamos r = tasa_descuento_periodica (TEM)
    duracion = calc.Duracion(flujos, tasa_descuento_periodica);
    convexidad = calc.Convexidad(flujos, tasa_descuento_periodica);

    // PROTEGER VALORES NO FINITOS
    duracion = isFinite(duracion) ? Number(duracion.toFixed(4)) : null;
    convexidad = isFinite(convexidad) ? Number(convexidad.toFixed(4)) : null;
  } catch (err) {
    // si falla cálculo de indicadores, seguimos pero con valores null
    van = van ?? null;
    tir = tir ?? null;
    tcea = tcea ?? null;
    duracion = duracion ?? null;
    convexidad = convexidad ?? null;
    console.warn("Advertencia: error calculando indicadores:", err.message || err);
  }

  // -------------------- GUARDAR TODO EN BD CON TRANSACCIÓN --------------------
  const t = await sequelize.transaction();
  try {
    // Guardar PlanPago
    const plan = await PlanPago.create(
      {
        precio_venta: money(precio_venta),
        cuota_inicial: money(cuota_inicial),
        bono_aplicable: money(monto_bono),
        monto_prestamo: money(monto_prestamo_bruto),
        num_anios,
        cuotas_por_anio,
        frecuencia_pago,
        total_cuotas,
        dias_por_anio: 360,
        cuota_fija: money(cuotaFija),
        total_intereses: money(cuotas.reduce((acc, c) => acc + toNum(c.interes), 0)),
        moneda: local.moneda || entidad.moneda || "PEN",
        tipo_gracia: tipoGracia || "SIN_GRACIA",
        meses_gracia: mesesGracia,
        entidadFinancieraId: entidad.id,
        userId: user.id,
        localId: local.id,
      },
      { transaction: t }
    );

    // Guardar Cuotas (bulk)
    const cuotasToInsert = cuotas.map((c) => ({
      numero: c.numero,
      saldo_inicial: money(c.saldo_inicial),
      saldo_inicial_indexado: money(c.saldo_inicial_indexado),
      interes: money(c.interes),
      cuota: money(c.cuota),
      amortizacion: money(c.amortizacion),
      prepago: money(c.prepago || 0),
      seguro_desgravamen: money(c.seguro_desgravamen || 0),
      seguro_riesgo: money(c.seguro_riesgo || 0),
      comision: money(c.comision || 0),
      portes: money(c.portes || 0),
      gastos_administrativos: money(c.gastos_administrativos || 0),
      saldo_final: money(c.saldo_final),
      flujo: money(c.flujo),
      planId: plan.id,
    }));

    // bulkCreate en lotes si son muchas cuotas
    await Cuota.bulkCreate(cuotasToInsert, { transaction: t });

    // Guardar Indicadores
    await IndicadorFinanciero.create(
      {
        tir: tir == null ? null : Number(Number(tir).toFixed(6)),
        van: van == null ? null : money(van),
        tcea: tcea == null ? null : money(tcea),
        trea: tir == null ? null : Number(Number(tir).toFixed(6)), // ejemplo TREa = tir 
        duracion: duracion == null ? null : duracion,
        convexidad: convexidad == null ? null : convexidad,
        tea: TEA == null ? null : Number(Number(TEA).toFixed(6)),
        tasa_descuento: tasa_descuento_periodica == null ? null : Number(Number(tasa_descuento_periodica).toFixed(6)),
        planId: plan.id,
      },
      { transaction: t }
    );

    await t.commit();

    // devolver estructura similar a la que se espera en el controlador
    return {
      plan: {
        id: plan.id,
        precio_venta: money(precio_venta),
        cuota_inicial: money(cuota_inicial),
        bono_aplicable: money(monto_bono),
        monto_prestamo: money(monto_prestamo_bruto),
        num_anios,
        cuotas_por_anio,
        frecuencia_pago,
        total_cuotas,
        dias_por_anio: 360,
        cuota_fija: money(cuotaFija),
        total_intereses: money(cuotas.reduce((acc, c) => acc + toNum(c.interes), 0)),
        entidadFinancieraId: entidad.id,
        userId: user.id,
        localId: local.id,
      },
      cuotas,
      indicadores: {
        van,
        tir,
        tcea,
        duracion,
        convexidad,
      },
      flujoInicial,
    };
  } catch (err) {
    await t.rollback();
    console.error("Error guardando plan en BD:", err);
    throw err;
  }
};
