import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const PlanPago = sequelize.define(
  "PlanPago",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    precio_venta: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    cuota_inicial: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    monto_prestamo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    num_anios: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cuotas_por_anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    frecuencia_pago: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_cuotas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dias_por_anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bono_aplicable: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    cuota_fija: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_intereses: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    // van: {
    //   type: DataTypes.DECIMAL(15, 2),
    //   allowNull: false,
    // },
    // tir: {
    //   type: DataTypes.DECIMAL(10, 2),
    //   allowNull: false,
    // },
    // tcea: {
    //   type: DataTypes.DECIMAL(10, 2),
    //   allowNull: false,
    // },
    // trea: {
    //   type: DataTypes.DECIMAL(10, 2),
    //   allowNull: false,
    // },
    // duracion: {
    //   type: DataTypes.DECIMAL(10, 4),
    //   allowNull: false,
    // },
    // convexidad: {
    //   type: DataTypes.DECIMAL(10, 4),
    //   allowNull: false,
    // },
    reporte_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
        references: {
        model: "users",
        key: "id",
      },
    },
    localId: {
      type: DataTypes.INTEGER,
      allowNull: false,
        references: {
        model: "locales",
        key: "id",
      },
    },
    entidadFinancieraId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "entidades_financieras",
        key: "id"
      }
    },

  },
  {
    tableName: "plan_pagos",
    timestamps: true,
  }
);

export default PlanPago;
