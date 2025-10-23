import Credito from '../models/Credito.js';
import { hash as _hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function createCredito(req, res) {
  const { monto, tasaInteres, plazoMeses } = req.body;
    try {
        const newCredito = await Credito.create({
            monto,
            tasa_interes: tasaInteres,
            plazo: plazoMeses,
        });
        res.status(201).json(newCredito);
    } catch (error) {
        console.error("Error creating credito:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getCreditos(req, res) {
    try {
        const creditos = await Credito.findAll();
        res.json(creditos);
    } catch (error) {
        console.error("Error fetching creditos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function getCreditoById(req, res) {
    const { id } = req.params;
    try {
        const credito = await Credito.findByPk(id);
        if (!credito) {
            return res.status(404).json({ error: "Credito not found" });
        }
        res.json(credito);
    } catch (error) {
        console.error("Error fetching credito:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function deleteCredito(req, res) {
    const { id } = req.params;
    try {
        const deleted = await Credito.destroy({
            where: { id }
        });
        if (!deleted) {
            return res.status(404).json({ error: "Credito not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting credito:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}   
export async function updateCredito(req, res) {
    const { id } = req.params;
    const { monto, tasaInteres, plazoMeses } = req.body;
    try {
        const credito = await Credito.findByPk(id);
        if (!credito) {
            return res.status(404).json({ error: "Credito not found" });
        }
        const updatedCredito = await credito.update({
            monto,
            tasa_interes: tasaInteres,
            plazo: plazoMeses,
        });
        res.json(updatedCredito);
    } catch (error) {
        console.error("Error updating credito:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
