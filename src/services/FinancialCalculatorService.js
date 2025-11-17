import { metodoFrances } from "./formulas/metodoFrances.js";
import { conversionTasas } from "./formulas/conversionTasas.js";
import { calcularTIR as tir } from "./formulas/tir.js";
import { calcularVAN as van } from "./formulas/van.js";
import { amortizacionPeriodo } from "./formulas/amortizacionPeriodo.js";
import { conversionMoneda } from "./formulas/conversionMoneda.js";
import { interesPeriodo } from "./formulas/interesPeriodo.js";

export const FinancialCalculatorService = {
  conversionMoneda,
  metodoFrances,
  conversionTasas,
  interesPeriodo,
  tir,
  van,
  amortizacionPeriodo,
};
