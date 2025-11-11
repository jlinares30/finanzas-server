import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Cuota = sequelize.define(
    "Cuota",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        numero: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        saldo_inicial: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        saldo_inicial_indexado: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        interes: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        cuota: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        amortizacion: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        prepago: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        seguro_desgravamen: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        seguro_riesgo: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        comision: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        portes: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        gastos_administrativos: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        saldo_final: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        flujo: {
            type: DataTypes.DECIMAL(15, 2),
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
        tableName: "cuotas",
        timestamps: true,
    }
);

export default Cuota;