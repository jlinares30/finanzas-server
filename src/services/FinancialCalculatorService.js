import { metodoFrances } from "./formulas/metodoFrances.js";
import { convertirTasa, nominalToTEA, teaToTEM } from "./formulas/conversionTasas.js";
import { calcularTIR as tir } from "./formulas/tir.js";
import { calcularVAN as van } from "./formulas/van.js";
import { amortizacionPeriodo } from "./formulas/amortizacionPeriodo.js";
import { convertirMoneda } from "./formulas/conversionMoneda.js";
import { interesPeriodo } from "./formulas/interesPeriodo.js";
import { TCEA } from "./formulas/tcea.js";
import { Convexidad, Duracion } from "./formulas/duracionConvexidad.js";

export const FinancialCalculatorService = {
  convertirMoneda,
  metodoFrances,
  convertirTasa,
  nominalToTEA,
  teaToTEM,
  interesPeriodo,
  tir,
  van,
  amortizacionPeriodo,
  TCEA,
  Duracion,
  Convexidad
};
