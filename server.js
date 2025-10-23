import express from "express";
import { sequelize } from "./src/config/db.js";
import { ENV } from "./src/config/env.js";
import authRoutes from './src/routes/authRoutes.js';
import creditoRoutes from './src/routes/creditoRoutes.js';
import cors from 'cors';
import User from "./src/models/User.js";
import Credito from "./src/models/Credito.js";
import Vivienda from "./src/models/Vivienda.js";

const app = express();
app.use(express.json());
app.use(cors());

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado exitosamente a PostgreSQL");

    await sequelize.sync({ alter: true });
    console.log("🧩 Tablas sincronizadas correctamente");

    app.use('/api/auth', authRoutes);
    app.use('/api/creditos', creditoRoutes);

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running on port ${ENV.PORT}`);
    });

  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
}

start();
