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

    // aplica solo para EFECTIVA
    frecuencia_efectiva: {
      type: DataTypes.ENUM(
      "ANUAL", "SEMESTRAL", "TRIMESTRAL","CUATRIMESTRAL","BIMESTRAL", "MENSUAL"),
      allowNull: true,
    },
    //------------------ SOLO para tasas nominales
    frecuencia_nominal: {
      type: DataTypes.ENUM(
        "ANUAL", "SEMESTRAL", "TRIMESTRAL","CUATRIMESTRAL","BIMESTRAL", "MENSUAL", "DIARIA"),
      allowNull: true,
    },

    //Tipos de capitalizacion
    // m = 360 → diaria
    // m = 12 → mensual
    // m = 6 → bimestral
    // m = 4 → trimestral
    // m = 3 → cuatrimestral
    // m = 2 → semestral
    // m = 1 → anual

    // solo aplica si es nominal
    capitalizacion: {
      type: DataTypes.INTEGER,
      allowNull: true,       
    },

    //----------------------------
    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      allowNull: false,
    },
    //regla si aplica seguro desgravamen
    aplica_seguro_desgravamen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    aplica_bono_techo_propio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    periodos_gracia_permitidos: {
      type: DataTypes.ENUM("SIN_GRACIA", "PARCIAL", "TOTAL"),
      allowNull: false
    },
    max_meses_gracia: {
      type: DataTypes.INTEGER,
      allowNull: true
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
