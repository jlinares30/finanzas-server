import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Credito = sequelize.define(
  "Credito",
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tasa_interes: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    plazo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    periodo_gracia: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capitalizacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    viviendaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "viviendas",
          key: "id",
        },
    },
  },
  {
    tableName: "creditos",
    timestamps: true,
  }
);

export default Credito;