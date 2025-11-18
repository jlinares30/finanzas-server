import User from '../models/User.js';
import Socioeconomico from '../models/Socioeconomico.js';
import Hogar from '../models/Hogar.js';

export const clienteController = {
  // POST /api/client/socioeconomico
  createSocioeconomico: async (req, res) => {
    try {
      const { ocupacion, ingresos_mensuales, tipo_contrato, nivel_educativo } = req.body;
      const userId = req.userId;

      const socioeconomico = await Socioeconomico.create({
        ocupacion,
        ingresos_mensuales,
        tipo_contrato,
        nivel_educativo,
        userId
      });

      res.status(201).json({
        message: 'Información socioeconómica guardada',
        socioeconomico
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/client/hogar
  createHogar: async (req, res) => {
    try {
      const { num_personas, tipo_vivienda } = req.body;
      const userId = req.userId;

      const hogar = await Hogar.create({
        num_personas,
        tipo_vivienda,
        userId
      });

      res.status(201).json({
        message: 'Información del hogar guardada',
        hogar
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/client/profile
  getCompleteProfile: async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findByPk(userId, {
        include: [Socioeconomico, Hogar]
      });

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};