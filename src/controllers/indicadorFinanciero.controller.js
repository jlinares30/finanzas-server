import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import Cuota from "../models/Cuota.js";

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

export async function calcularIndicadores(req, res) {
  try {
    const { planId, tasa_descuento, valorInmueble, bonoFmv = 0 } = req.body;

    const cuotas = await Cuota.find({ planId }).sort({ numero: 1 });

    if (!cuotas.length) {
      return res.status(400).json({ message: "No existen cuotas para el plan" });
    }

    // ===========================
    // Extraer flujos
    // ===========================
    const flujos = cuotas.map((c) => Number(c.flujo));

    // VAN - TIR
    const van = calcularVAN(flujos, tasa_descuento);
    const tir = calcularTIR(flujos);

    // TCEA real y cliente
    const tcea_real = TCEA(tir); // sin seguros
    const tcea_cliente = TCEA(tir * 1.02); // ejemplo → agregar seguros/periodicos

    // INTERESES
    const interesesTotales = cuotas.reduce((acc, c) => acc + Number(c.interes), 0);

    // COSTO TOTAL DEL PRÉSTAMO
    const costoTotalPrestamo = cuotas.reduce(
      (acc, c) => acc + Number(c.cuotaTotal),
      0
    );

    // SEGUROS
    const segurosTotales = cuotas.reduce(
      (acc, c) => acc + Number(c.seguro || 0),
      0
    );

    // COSTOS PERIODICOS
    const costoPeriodicoTotal = cuotas.reduce(
      (acc, c) => acc + Number(c.costoPeriodico || 0),
      0
    );

    // RELACIÓN TOTAL PAGADO / VALOR INMUEBLE
    const relacionPagoVsInmueble = costoTotalPrestamo / valorInmueble;

    // IMPACTO DEL BONO
    const impactoBono = valorInmueble > 0 ? bonoFmv / valorInmueble : 0;

    // DURACIÓN Y CONVEXIDAD
    const duracion = calcularDuracion(flujos, tir);
    const convexidad = calcularConvexidad(flujos, tir);

    // ===========================
    // GUARDAR
    // ===========================
    const indicadores = await IndicadorFinanciero.create({
      planId,
      tasa_descuento,

      // principales
      van,
      tir,
      tcea_real,
      tcea_cliente,
      duracion,
      convexidad,

      // adicionales solicitados
      interesesTotales,
      costoTotalPrestamo,
      segurosTotales,
      costoPeriodicoTotal,
      relacionPagoVsInmueble,
      impactoBono,
    });

    res.status(201).json({
      message: "Indicadores financieros completos calculados",
      indicadores,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
