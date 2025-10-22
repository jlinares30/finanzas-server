import { Sequelize } from "sequelize";
import { ENV } from "./env.js";

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
