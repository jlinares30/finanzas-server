import express from "express";
import { Sequelize } from "sequelize";
import { ENV } from "./src/config/env.js";
import authRoutes from './src/routes/authRoutes.js';
import cors from 'cors';

const app = express();

export const sequelize = new Sequelize(
  ENV.DB_NAME,
  ENV.DB_USER,
  ENV.DB_PASSWORD,
  {
    host: ENV.DB_HOST,
    dialect: "postgres",
    port: ENV.DB_PORT,
    logging: false,
  }
);

app.use(express.json());
app.use(cors());

async function start() {
    app.use('/api/auth', authRoutes);

    app.listen(ENV.PORT, () => {
        console.log(`Server running on port ${ENV.PORT}`);
    });

}

start();