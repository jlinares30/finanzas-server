import express from "express";
import { sequelize } from "./src/config/db.js";
import { ENV } from "./src/config/env.js";
import authRoutes from './src/routes/auth.routes.js';
import catalogoRoutes from './src/routes/catalogo.routes.js';
import entidadRoutes from './src/routes/entidadFinanciera.routes.js';
import clienteRoutes from './src/routes/cliente.routes.js';
import planPagosRoutes from './src/routes/planPago.routes.js';
import indicadoresRoutes from './src/routes/indicadores.routes.js';
import cors from 'cors';
import User from "./src/models/User.js";
import PlanPagos from "./src/models/PlanPagos.js";
import EntidadFinanciera from "./src/models/EntidadFinanciera.js";
import Cliente from "./src/models/Cliente.js";
import Catalogo from "./src/models/Catalogo.js";
import Cuota from "./src/models/Cuota.js";
import IndicadorFinanciero from "./src/models/IndicadorFinanciero.js";


const app = express();
app.use(express.json());
app.use(cors());

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Conectado exitosamente a PostgreSQL");

    await sequelize.sync({ alter: true });
    console.log("Tablas sincronizadas correctamente");

    app.use('/api/auth', authRoutes);
    app.use('/api/catalogo', catalogoRoutes);
    app.use('/api/cliente', clienteRoutes);
    app.use('/api/entidad', entidadRoutes);
    app.use('/api/indicador', indicadoresRoutes);
    app.use('/api/plan-pagos', planPagosRoutes);

    app.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
    });

  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
}

start();
