import PlanPago from "../models/PlanPago.js";
import Cuota from "../models/Cuota.js";
import EntidadFinanciera from "../models/EntidadFinanciera.js";
import IndicadorFinanciero from "../models/IndicadorFinanciero.js";
import Local from "../models/Local.js";
import { generarPlanPagoService } from "../services/planPago.service.js";

export const generarPlanPago = async (req, res) => {
  try {
    const data = req.body;

    const resultado = await generarPlanPagoService(data);

    res.json({
      message: "Plan de pagos generado correctamente",
      ...resultado
    });
  } catch (error) {
    console.error("Error en generarPlanPago:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Datos de entrada inválidos",
        errors: error.errors.map((e) => e.message),
      });
    }

    return res.status(500).json({
      message: "Error interno al generar plan de pago",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};



export const getPlanesPagosByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const planes = await PlanPago.findAll({
      where: { userId },
      include: [
        { model: Local },
        { model: EntidadFinanciera }
      ],
    });
    res.json(planes);
  } catch (error) {
    console.error("Error en getPlanesPagosByUser:", error);
    res.status(500).json({ message: "Error interno al obtener planes de pagos" });
  }
};

export const getPlanPagoById = async (req, res) => {
  try {
    const planId = req.params.id;
    const plan = await PlanPago.findByPk(planId, {
      include: [
        { model: Local },
        { model: EntidadFinanciera },
        { model: Cuota },
        { model: IndicadorFinanciero }
      ],
    }); 
    if (!plan) {
      return res.status(404).json({ message: "Plan de pago no encontrado" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error en getPlanPagoById:", error);
    res.status(500).json({ message: "Error interno al obtener el plan de pago" });
  }
};

export const eliminarPlanPago = async (req, res) => {
  try {
    const planId = req.params.id;
    const plan = await PlanPago.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de pago no encontrado" });
    }
    await Cuota.destroy({ where: { planId } });
    await IndicadorFinanciero.destroy({ where: { planId } });
    await plan.destroy();
    res.json({ message: "Plan de pago eliminado correctamente" });
  }
    catch (error) {
    console.error("Error en eliminarPlanPago:", error);
    res.status(500).json({ message: "Error interno al eliminar el plan de pago" });
  }
};

export const obtenerCuotasPorPlan = async (req, res) => {
  try {
    const planId = req.params.id;
    const cuotas = await Cuota.findAll({ where: { planId } });
    res.json(cuotas);
  } catch (error) {
    console.error("Error en obtenerCuotasPorPlan:", error);
    res.status(500).json({ message: "Error interno al obtener las cuotas del plan" });
  }
};
