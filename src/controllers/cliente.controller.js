import User from '../models/User.js';
import Socioeconomico from '../models/Socioeconomico.js';

// POST /api/client/socioeconomico
export async function createSocioeconomico(req, res) {
  try {
    const { ocupacion, ingresos_mensuales, tipo_contrato, nivel_educativo, userId } = req.body;

    console.log("req ", req.body);

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
}

// GET /api/client/profile
export async function getCompleteProfile(req, res) {
  try {
    const userId = req.user.dataValues.id;

    const user = await User.findByPk(userId, {
      include: [Socioeconomico]
    });

    res.json({ user });
    console.log("user", user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// POST /api/client/profile
export async function updateProfile(req, res) {
  try {
    const { name, email, dni, age, gender, birthdate } = req.body;
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.name = name;
    user.email = email;
    user.dni = dni;
    user.age = age;
    user.gender = gender;
    user.birthdate = birthdate;

    await user.save();

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/client/socioeconomico
export async function updateSocioeconomico(req, res) {
  try {
    const { ocupacion, ingresos_mensuales, tipo_contrato, nivel_educativo } = req.body;
    const { userId } = req.params;

    console.log("req ", req.body);

    let socioeconomico = await Socioeconomico.findOne({ where: { userId } });

    if (socioeconomico) {
      socioeconomico.ocupacion = ocupacion;
      socioeconomico.ingresos_mensuales = ingresos_mensuales;
      socioeconomico.tipo_contrato = tipo_contrato;
      socioeconomico.nivel_educativo = nivel_educativo;
      await socioeconomico.save();
    } else {
      socioeconomico = await Socioeconomico.create({
        ocupacion,
        ingresos_mensuales,
        tipo_contrato,
        nivel_educativo,
        userId
      });
    }

    res.status(200).json({
      message: 'Información socioeconómica actualizada',
      socioeconomico
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}