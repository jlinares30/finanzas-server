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
const MONTO_BONO_OFICIAL = 46545; // Actualizado 2024/25

function getMFromCapitalizacion(cap) {
  if (typeof cap === "number") return cap;

  switch ((cap || "").toString().toLowerCase()) {
    case "mensual": case "m": case "12": return 12;
    case "bimestral": case "b": case "6": return 6;
    case "trimestral": case "4": return 4;
    case "cuatrimestral": return 3;
    case "semestral": return 2;
    case "anual": return 1;
    case "diaria": case "360": return 360;
    default: return 12;
  }
}

export const generarPlanPagoService = async (data) => {
  let {
    localId,
    userId,
    entidadFinancieraId,
    precio_venta,
    cuota_inicial = 0,
    bono_aplicable = false,
    num_anios,
    frecuencia_pago = "mensual",
    tipo_cambio = 3.85,
    tipo_tasa: tipo_tasa_input,
    tasa_interes_anual: tasa_input,
    capitalizacion: capitalizacion_input,
    periodo_gracia = { tipo: "SIN_GRACIA", meses: 0 },
    cok: cok_input = 0,
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

  // -------------------- GESTIÓN DE MONEDAS -------------------
  const monedaLocal = local.moneda;
  const monedaBanco = entidad.moneda;

  if (monedaLocal !== monedaBanco) {
    const tc = toNum(tipo_cambio) || 3.85;

    if (monedaLocal === 'USD' && monedaBanco === 'PEN') {
      precio_venta = money(precio_venta * tc);
      cuota_inicial = money(cuota_inicial * tc);
    }
    else if (monedaLocal === 'PEN' && monedaBanco === 'USD') {
      precio_venta = money(precio_venta / tc);
      cuota_inicial = money(cuota_inicial / tc);
    }
  }

  // -------------------- OBTENER COSTOS --------------------
  const costoInicial = (await CostoInicial.findOne({ where: { localId } })) || null;
  const costoPeriodico = (await CostoPeriodico.findOne({ where: { localId } })) || null;
  const socioeconomico = (await Socioeconomico.findOne({ where: { userId } })) || null;

  // -------------------- DEFINIR FRECUENCIA (Lógica Unificada) --------------------
  // Calculamos esto UNA sola vez y lo usamos para todo (TEP, Total Cuotas, VAN)
  let cuotas_por_anio = 12;

  switch ((frecuencia_pago || "").toLowerCase()) {
    case "mensual": cuotas_por_anio = 12; break;
    case "bimestral": cuotas_por_anio = 6; break;
    case "trimestral": cuotas_por_anio = 4; break;
    case "cuatrimestral": cuotas_por_anio = 3; break;
    case "semestral": cuotas_por_anio = 2; break;
    case "anual": cuotas_por_anio = 1; break;
    default: cuotas_por_anio = 12;
  }

  // -------------------- DETERMINAR TASAS (TEA y TEP) --------------------
  const tipo_tasa = tipo_tasa_input ? tipo_tasa_input.toUpperCase() : (entidad.tipo_tasa || "NOMINAL");
  const tasa_origen = tasa_input != null ? toNum(tasa_input) : toNum(entidad.tasa_interes);
  const capitalizacion = capitalizacion_input ?? entidad.capitalizacion ?? 12;

  // Calcular TEA (Tasa Efectiva Anual)
  let TEA = tasa_origen;
  if (tipo_tasa === "NOMINAL") {
    const m = getMFromCapitalizacion(capitalizacion);
    if (!calc.nominalToTEA) throw new Error("Falta función nominalToTEA en FinancialCalculatorService");
    TEA = calc.nominalToTEA(tasa_origen, m);
  }

  // Calcular TEP (Tasa Efectiva del Periodo)
  // Usamos la variable unificada 'cuotas_por_anio'
  if (!calc.teaToTEP) throw new Error("Falta función teaToTEP en FinancialCalculatorService");
  const TEP = calc.teaToTEP(TEA, cuotas_por_anio);

  // -------------------- MONTO FINANCIADO / BONO --------------------
  let monto_bono = 0;
  if (bono_aplicable) {
    if (!entidad.aplica_bono_techo_propio) throw new Error("Banco no permite BFH/Techo Propio");
    if (socioeconomico.ingresos_mensuales > 3715) throw new Error("No califica por ingresos familiares altos");

    const LIMITE_PRECIO_PEN = 128900;
    let limite_comparacion = LIMITE_PRECIO_PEN;

    if (monedaBanco === 'USD') {
      const tc = toNum(tipo_cambio) || 3.85;
      limite_comparacion = LIMITE_PRECIO_PEN / tc;
    }

    if (precio_venta > limite_comparacion) {
      throw new Error(`No califica porque el inmueble supera el tope del programa (${monedaBanco === 'PEN' ? 'S/' : '$'} ${money(limite_comparacion)})`);
    }

    monto_bono = MONTO_BONO_OFICIAL;

    if (monedaBanco === 'USD') {
      const tc = toNum(tipo_cambio) || 3.85;
      monto_bono = money(monto_bono / tc);
    }
  }

  const monto_prestamo_bruto = money(toNum(precio_venta) - toNum(cuota_inicial) - toNum(monto_bono));
  if (monto_prestamo_bruto <= 0) throw new Error("Monto del préstamo inválido o <= 0");

  // -------------------- COSTOS INICIALES --------------------
  const comisionActivacion = costoInicial ? toNum(costoInicial.comision_activacion || 0) : 0;
  const initialCostsFinanced = money(comisionActivacion);

  const costesNotariales = costoInicial ? toNum(costoInicial.costes_notariales || 0) : 0;
  const costesRegistrales = costoInicial ? toNum(costoInicial.costes_registrales || 0) : 0;
  const tasacion = costoInicial ? toNum(costoInicial.tasacion || 0) : 0;
  const seguroRiesgoInicial = costoInicial ? toNum(costoInicial.seguro_riesgo || 0) : 0;
  const comisionEstudio = costoInicial ? toNum(costoInicial.comision_estudio || 0) : 0;

  const initialCostsPaidByClient = money(costesNotariales + costesRegistrales + tasacion + seguroRiesgoInicial + comisionEstudio);
  const monto_neto_desembolso = money(monto_prestamo_bruto - initialCostsFinanced);

  // -------------------- PERIODOS Y GRACIA --------------------
  const total_cuotas = toNum(num_anios) * cuotas_por_anio;

  const tipoGracia = (periodo_gracia && periodo_gracia.tipo) ? periodo_gracia.tipo : "SIN_GRACIA";
  const mesesGracia = (periodo_gracia && periodo_gracia.meses) ? toNum(periodo_gracia.meses) : 0;

  // Validación de Gracia vs Entidad
  const permitidoPorBanco = entidad.periodos_gracia_permitidos;
  if (mesesGracia > 0) {
    let esValido = false;
    if (permitidoPorBanco === 'AMBOS') {
      if (tipoGracia === 'TOTAL' || tipoGracia === 'PARCIAL') esValido = true;
    } else {
      if (tipoGracia === permitidoPorBanco) esValido = true;
    }
    if (!esValido) throw new Error(`El banco no permite el tipo de gracia '${tipoGracia}'. Permitido: ${permitidoPorBanco}`);
  }

  if (mesesGracia > (entidad.max_meses_gracia || 0)) {
    throw new Error(`Entidad permite máximo ${entidad.max_meses_gracia || 0} meses de gracia`);
  }

  // --- LÓGICA DE GRACIA ---
  // Convertimos "meses de gracia" a "periodos de gracia" según la frecuencia
  const mesesPorCuota = 12 / cuotas_por_anio;
  const periodosGraciaReales = Math.floor(mesesGracia / mesesPorCuota);

  // Balance inicial
  let saldoInicialParaAmortizar = monto_prestamo_bruto;

  if (tipoGracia === "TOTAL" && periodosGraciaReales > 0) {
    // Capitalizamos usando TEP y periodos reales
    saldoInicialParaAmortizar = money(monto_prestamo_bruto * Math.pow(1 + TEP, periodosGraciaReales));
  }

  const periodosGraciaUsados = (tipoGracia !== "SIN_GRACIA") ? periodosGraciaReales : 0;
  const cuotasQueAmortizan = total_cuotas - periodosGraciaUsados;

  if (cuotasQueAmortizan <= 0) throw new Error("Periodo de gracia excede el total de cuotas");

  // -------------------- CALCULO CUOTA FRANCESA --------------------
  const cuotaFija = money(calc.metodoFrances(saldoInicialParaAmortizar, TEP, cuotasQueAmortizan));

  // -------------------- COSTOS PERIÓDICOS --------------------
  const costoPeriodoComision = costoPeriodico ? toNum(costoPeriodico.comision_periodica || 0) : 0;
  const costoPeriodoPortes = costoPeriodico ? toNum(costoPeriodico.portes || 0) : 0;
  const costoPeriodoGastosAdministrativos = costoPeriodico ? toNum(costoPeriodico.gastos_administrativos || 0) : 0;
  const entidadComisionMensual = toNum(entidad.comision_mensual || 0);
  const entidadGastosAdministrativos = toNum(entidad.gastos_administrativos || 0);

  const aplicaSeguroDesgrav = entidad.aplica_seguro_desgravamen === true;
  const seguroDesgravPorcentaje = toNum(entidad.seguro_desgravamen || 0);
  const costoSeguroTodoRiesgo = costoPeriodico ? toNum(costoPeriodico.seguro_contra_todo_riesgo || 0) : 0;

  // -------------------- GENERACIÓN DEL CRONOGRAMA --------------------
  const cuotas = [];
  const flujos = [];

  const flujoInicial = money(monto_neto_desembolso - initialCostsPaidByClient);
  flujos.push(flujoInicial);

  let saldo = saldoInicialParaAmortizar;

  // Generar Periodos de Gracia
  for (let g = 1; g <= periodosGraciaUsados; g++) {
    let interes = 0;
    let amortizacion = 0;
    let cuotaBase = 0;

    if (tipoGracia === "TOTAL") {
      interes = 0;
      amortizacion = 0;
      cuotaBase = 0;
    } else if (tipoGracia === "PARCIAL") {
      interes = money(saldo * TEP);
      amortizacion = 0;
      cuotaBase = interes;
    }

    const seguro_desgravamen = aplicaSeguroDesgrav ? money(seguroDesgravPorcentaje * saldo) : 0;
    const seguro_riesgo_periodico = costoSeguroTodoRiesgo;
    const comision_total = money(entidadComisionMensual + costoPeriodoComision);
    const portes = money(costoPeriodoPortes);
    const gastosAdmin = money(entidadGastosAdministrativos + costoPeriodoGastosAdministrativos);

    const cuotaTotal = money(cuotaBase + seguro_desgravamen + seguro_riesgo_periodico + comision_total + portes + gastosAdmin);

    flujos.push(-cuotaTotal);

    cuotas.push({
      numero: g,
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
      saldo_final: money(saldo),
      flujo: -cuotaTotal,
    });
  }

  // Generar Cuotas de Amortización
  for (let i = 1; i <= cuotasQueAmortizan; i++) {
    const periodo = periodosGraciaUsados + i;

    const interes = money(saldo * TEP);
    const amortizacion = money(cuotaFija - interes);
    const saldo_final = money(saldo - amortizacion);

    const seguro_desgravamen = aplicaSeguroDesgrav ? money(seguroDesgravPorcentaje * saldo) : 0;
    const seguro_riesgo_periodico = costoSeguroTodoRiesgo;
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
      saldo_final: saldo_final < 0 ? 0 : saldo_final,
      flujo: -cuotaTotal,
    });

    saldo = saldo_final;
  }

  // -------------------- INDICADORES (VAN, TIR, TCEA) --------------------
  // Si existe COK input, se usa. Si no, se usa la TEA del préstamo.
  const tasa_descuento_anual = cok_input > 0 ? toNum(cok_input) : TEA;

  // Convertir tasa anual a la del periodo para el VAN
  const tasa_descuento_periodica_van = Math.pow(1 + tasa_descuento_anual, 1 / cuotas_por_anio) - 1;

  let van = null, tir = null, tcea = null, duracion = null, convexidad = null;

  try {
    if (!calc.van || !calc.tir || !calc.TCEA) throw new Error("Faltan funciones financieras");

    van = money(calc.van(flujos, tasa_descuento_periodica_van));

    tir = calc.tir(flujos);
    if (tir != null && isFinite(tir)) {
      tcea = money(calc.TCEA(tir));
    }

    if (calc.Duracion) duracion = Number(calc.Duracion(flujos, tasa_descuento_periodica_van).toFixed(4));
    if (calc.Convexidad) convexidad = Number(calc.Convexidad(flujos, tasa_descuento_periodica_van).toFixed(4));

  } catch (err) {
    console.warn("Advertencia: error calculando indicadores", err.message);
  }

  // -------------------- GUARDAR EN BD --------------------
  const t = await sequelize.transaction();
  try {
    const plan = await PlanPago.create({
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
      moneda: monedaBanco,
      tipo_gracia: tipoGracia || "SIN_GRACIA",
      meses_gracia: mesesGracia,
      cok: tasa_descuento_anual,
      tipo_cambio_usado: tipo_cambio,
      entidadFinancieraId: entidad.id,
      userId: user.id,
      localId: local.id,
    }, { transaction: t });


    const cuotasToInsert = cuotas.map(c => ({ ...c, planId: plan.id }));
    await Cuota.bulkCreate(cuotasToInsert, { transaction: t });

    await IndicadorFinanciero.create({
      tir: tir,
      van: van,
      tcea: tcea,
      duracion: duracion,
      convexidad: convexidad,
      tea: TEA,
      tasa_descuento: tasa_descuento_periodica_van,
      planId: plan.id,
    }, { transaction: t });

    await t.commit();

    return {
      plan: { ...plan.toJSON() },
      cuotas,
      indicadores: { van, tir, tcea, duracion, convexidad, TEA },
      flujoInicial
    };

  } catch (err) {
    await t.rollback();
    console.error("Error guardando plan:", err);
    throw err;
  }
};