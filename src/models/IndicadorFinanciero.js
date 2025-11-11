import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const IndicadorFinanciero = sequelize.define(
    "IndicadorFinanciero",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        tir: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        van: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tcea: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        trea: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        duracion: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
        },
        convexidad: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
        },
        tea: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        tasa_descuento: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "planes_pago",
                key: "id",
            },
        },
    },
    {
        tableName: "indicadores_financieros",
        timestamps: true,
    }
);

export default IndicadorFinanciero;