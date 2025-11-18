import EntidadFinanciera from '../models/EntidadFinanciera.js';
import Local from '../models/Local.js';

export const catalogoController = {
  // GET /api/catalog/entidades-financieras
  getEntidadesFinancieras: async (req, res) => {
    try {
      const { moneda } = req.query;
      
      const where = { activo: true };
      if (moneda) where.moneda = moneda;

      const entidades = await EntidadFinanciera.findAll({ where });
      
      res.json({ entidades });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/catalog/locales
  getLocales: async (req, res) => {
    try {
      const locales = await Local.findAll({ 
        where: { /* condiciones si las hay */ },
        include: [CostoInicial, CostoPeriodico] // Incluir costos asociados
      });
      
      res.json({ locales });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/catalog/locales/:id
  getLocalById: async (req, res) => {
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
};