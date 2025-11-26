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