import * as FinancialCalculator from "../services/FinancialCalculatorService.js";

export async function crearPlanCredito(req, res) {
  try {
    const { monto, tasaAnual, meses, metodo } = req.body;

    if (!monto || !tasaAnual || !meses) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const resultado = FinancialCalculator.generarPlan({
      monto,
      tasaAnual,
      meses,
      metodo,
    });

    return res.status(201).json({
      message: "Plan de crédito generado correctamente",
      data: resultado,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error generando el plan" });
  }
}
