import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const EntidadFinanciera = sequelize.define(
  "EntidadFinanciera",
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
    tipo_tasa: {
      type: DataTypes.ENUM("EFECTIVA", "NOMINAL"),
      allowNull: false,
    },

    tasa_interes: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
    },
     // solo aplica si es nominal
    capitalizacion: {
      type: DataTypes.INTEGER,
      allowNull: true,       
    },

    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
    },

    seguro_desgravamen: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
    },
    seguro_inmueble: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
    },
    comision_mensual: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
    },
    gastos_administrativos: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
    },


    aplica_bono_techo_propio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },


    gracia_total_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gracia_parcial_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "entidades_financieras",
    timestamps: true,
  }
);

export default EntidadFinanciera;
