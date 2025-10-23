import PlanPagos from '../models/PlanPagos.js';
import { hash as _hash, compare } from 'bcrypt';


export async function createPlanPago(req, res) {
  const { num_cuota, interes, cuota, amortizacion, saldo, creditoId } = req.body;

  try {
    const newPlanPago = await PlanPagos.create({
      num_cuota,
      interes,
      cuota,
      amortizacion,
      saldo,
      creditoId
    });
    res.status(201).json(newPlanPago);
  } catch (error) {
    console.error("Error creating PlanPago:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getPlanPagos(req, res) {
  try {
    const planPagos = await PlanPagos.findAll();
    res.json(planPagos);
  } catch (error) {
    console.error("Error fetching PlanPagos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getPlanPagoById(req, res) {
    const { id } = req.params;
    try {
        const planPago = await PlanPagos.findByPk(id);
        if (!planPago) {
            return res.status(404).json({ error: "PlanPago not found" });
        }
        res.json(planPago);
    } catch (error) {
        console.error("Error fetching PlanPago:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function deletePlanPago(req, res) {
    const { id } = req.params;
    try {
        const deleted = await PlanPagos.destroy({
            where: { id }
        });
        if (!deleted) {
            return res.status(404).json({ error: "PlanPago not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting PlanPago:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function updatePlanPago(req, res) {
    const { id } = req.params;
    const { num_cuota, interes, cuota, amortizacion, saldo, creditoId } = req.body;
    try {
        const planPago = await PlanPagos.findByPk(id);
        if (!planPago) {
            return res.status(404).json({ error: "PlanPago not found" });
        }
        const updatedPlanPago = await planPago.update({
            num_cuota,
            interes,
            cuota,
            amortizacion,
            saldo,
            creditoId
        });
        res.json(updatedPlanPago);
    } catch (error) {
        console.error("Error updating PlanPago:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}