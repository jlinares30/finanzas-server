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
    sueldo_minimo: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
    imagen_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    moneda: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
    },
    // tipo_tasa: {
    //     type: DataTypes.STRING,
    //     allowNull: false,
    //     defaultValue: "fija",
    // },
    // tasa_interes_anual: {
    //     type: DataTypes.DECIMAL(5, 2),
    //     allowNull: false,
    //     defaultValue: 0,
    // },
    // periodo_gracia: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     defaultValue: 0,
    // },
    // capitalizacion: {
    //     type: DataTypes.STRING,
    //     allowNull: false,
    //     defaultValue: "mensual",
    // },
  },
  {
    tableName: "locales",
    timestamps: true,
  }
);

export default Local;