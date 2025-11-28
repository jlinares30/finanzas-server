import { sequelize } from '../config/db.js';
import EntidadFinanciera from '../models/EntidadFinanciera.js';
import Local from '../models/Local.js';
import CostoInicial from '../models/CostoInicial.js';
import CostoPeriodico from '../models/CostoPeriodico.js';

// GET /api/catalog/entidades-financieras
export async function getEntidadesFinancieras(req, res) {
  try {
    const { moneda } = req.query;

    const where = { activo: true };
    if (moneda) where.moneda = moneda;

    const entidades = await EntidadFinanciera.findAll({ where });

    res.json({ entidades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/catalog/locales
export async function getLocales(req, res) {
  try {
    const locales = await Local.findAll({
      where: { /* condiciones si las hay */ },
    });

    res.json({ locales });
  } catch (error) {
    console.error("ERROR GET /locales:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/catalog/locales/:id
export async function getLocalById(req, res) {
  try {
    const { id } = req.params;

    const local = await Local.findByPk(id, {
      include: [CostoInicial, CostoPeriodico]
    });

    if (!local) {
      return res.status(404).json({ error: 'Local no encontrado' });
    }

    res.json({ local });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


export async function createLocal(req, res) {
  try {
    const { nombre, precio, tipo, direccion, sueldo_minimo, imagen_url, moneda } = req.body;
    const local = await Local.create({ nombre, precio, tipo, direccion, sueldo_minimo, imagen_url, moneda });
    res.status(201).json({ local });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateLocal(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nombre, precio, tipo, direccion, sueldo_minimo, imagen_url, moneda, CostoInicial: costoInicialData, CostoPeriodico: costoPeriodicoData } = req.body;

    const local = await Local.findByPk(id, { transaction: t });
    if (!local) {
      await t.rollback();
      return res.status(404).json({ error: 'Local no encontrado' });
    }

    // Update Local fields
    local.nombre = nombre;
    local.precio = precio;
    local.tipo = tipo;
    local.direccion = direccion;
    local.sueldo_minimo = sueldo_minimo;
    local.imagen_url = imagen_url;
    local.moneda = moneda;
    await local.save({ transaction: t });

    // Update or Create CostoInicial
    if (costoInicialData) {
      const existingCostoInicial = await CostoInicial.findOne({ where: { localId: id }, transaction: t });
      if (existingCostoInicial) {
        await existingCostoInicial.update(costoInicialData, { transaction: t });
      } else {
        // Ensure localId is set
        await CostoInicial.create({ ...costoInicialData, localId: id }, { transaction: t });
      }
    }

    // Update or Create CostoPeriodico
    if (costoPeriodicoData) {
      const existingCostoPeriodico = await CostoPeriodico.findOne({ where: { localId: id }, transaction: t });
      if (existingCostoPeriodico) {
        await existingCostoPeriodico.update(costoPeriodicoData, { transaction: t });
      } else {
        // Ensure localId is set
        await CostoPeriodico.create({ ...costoPeriodicoData, localId: id }, { transaction: t });
      }
    }

    await t.commit();

    // Return the updated local with associations
    const updatedLocal = await Local.findByPk(id, {
      include: [CostoInicial, CostoPeriodico]
    });

    res.json({ local: updatedLocal });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
}