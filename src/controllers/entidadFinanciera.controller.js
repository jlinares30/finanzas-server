import * as entidadFinancieraService from "../services/entidadFinanciera.service.js";

export async function getAllEntidades(req, res) {
  try {
    const entidades = await entidadFinancieraService.getAll();
    res.json(entidades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEntidadById(req, res) {
  try {
    const entidad = await entidadFinancieraService.getById(req.params.id);

    if (!entidad) {
      return res.status(404).json({ message: "Entidad financiera no encontrada" });
    }

    res.json(entidad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createEntidad(req, res) {
  try {
    const entidad = await entidadFinancieraService.create(req.body);
    res.status(201).json(entidad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateEntidad(req, res) {
  try {
    const entidad = await entidadFinancieraService.update(req.params.id, req.body);
    res.json(entidad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function removeEntidad(req, res) {
  try {
    await entidadFinancieraService.remove(req.params.id);
    res.json({ message: "Entidad financiera eliminada" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
