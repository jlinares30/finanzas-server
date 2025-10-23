import Vivienda from '../models/Vivienda.js';
import { hash as _hash, compare } from 'bcrypt';

export async function createVivienda(req, res) {
  const { direccion, ciudad, codigo_postal, pais, precio } = req.body;

  try {
    const newVivienda = await Vivienda.create({
      direccion,
      ciudad,
      codigo_postal,
      pais,
      precio
    });
    res.status(201).json(newVivienda);
  } catch (error) {
    console.error("Error creating Vivienda:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
export async function getViviendas(req, res) {
    try {
        const viviendas = await Vivienda.findAll();
        res.json(viviendas);
    } catch (error) {
        console.error("Error fetching viviendas:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function getViviendaById(req, res) {
    const { id } = req.params;
    try {
        const vivienda = await Vivienda.findByPk(id);
        if (!vivienda) {
            return res.status(404).json({ error: "Vivienda not found" });
        }
        res.json(vivienda);
    } catch (error) {
        console.error("Error fetching Vivienda:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function deleteVivienda(req, res) {
    const { id } = req.params;
    try {
        const deleted = await Vivienda.destroy({
            where: { id }
        });
        if (!deleted) {
            return res.status(404).json({ error: "Vivienda not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting Vivienda:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function updateVivienda(req, res) {
    const { id } = req.params;
    const { direccion, ciudad, codigo_postal, pais, precio } = req.body;

    try {
        const vivienda = await Vivienda.findByPk(id);
        if (!vivienda) {
            return res.status(404).json({ error: "Vivienda not found" });
        }
        const updatedVivienda = await vivienda.update({
            direccion,
            ciudad,
            codigo_postal,
            pais,
            precio
        });
        res.json(updatedVivienda);
    } catch (error) {
        console.error("Error updating Vivienda:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}