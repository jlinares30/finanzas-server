import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Vivienda = sequelize.define(
  "Vivienda",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    precio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ubicacion: {
        type: DataTypes.STRING,
      allowNull: false,
    },
    bono_tec: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
  },
  {
    tableName: "viviendas",
    timestamps: true,
  }
);

export default Vivienda;