import { IndicadorFinanciero } from "../models/IndicadorFinanciero.model.js";
import { Cuota } from "../models/Cuota.model.js";

  // GET indicadores por plan
  export async function getIndicadoresByPlan(req, res) {
    try {
      const { planId } = req.params;

      const indicadores = await IndicadorFinanciero.findOne({ planId });

      if (!indicadores) {
        return res.status(404).json({ message: "No hay indicadores para este plan" });
      }

      res.json(indicadores);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST calcular y guardar indicadores
  export async function calcularIndicadores(req, res) {
    try {
      const { planId, tasa_descuento } = req.body;

      const cuotas = await Cuota.find({ planId }).sort({ numero: 1 });

      if (!cuotas.length) {
        return res.status(400).json({ message: "No existen cuotas para el plan" });
      }

      // Extraer flujos (negativos al inicio si hay desembolso inicial)
      const flujos = cuotas.map((c) => Number(c.flujo));

      // Cálculos
      const van = calcularVAN(flujos, tasa_descuento);
      const tir = calcularTIR(flujos);
      const tcea = calcularTCEA(tir); 
      const trea = calcularTREA(tir);
      const duracion = calcularDuracion(flujos, tir);
      const convexidad = calcularConvexidad(flujos, tir);

      // Guardar en BD
      const indicadores = await IndicadorFinanciero.create({
        van,
        tir,
        tcea,
        trea,
        duracion,
        convexidad,
        tasa_descuento,
        tea: tcea,
        planId,
      });

      res.status(201).json({
        message: "Indicadores financieros calculados",
        indicadores,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }