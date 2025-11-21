import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Local = sequelize.define(
  "Local",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING,
      allowNull: false,
    },
    imagen_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    moneda: {
        type: DataTypes.ENUM("PEN", "USD"),
        allowNull: false,
    },
  },
  {
    tableName: "locales",
    timestamps: true,
  }
);

export default Local;