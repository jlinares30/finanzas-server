import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const PlanPagos = sequelize.define(
  "PlanPagos",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_cuota: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    interes: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cuota: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amortizacion: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    saldo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    creditoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
        references: {
        model: "creditos",
        key: "id",
      },
    },
  },
  {
    tableName: "plan_pagos",
    timestamps: false,
  }
);

export default PlanPagos;
