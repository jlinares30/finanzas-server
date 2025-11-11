import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const CostoInicial = sequelize.define(
    "CostoInicial",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        porcentaje_seguro_desgravamen: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        costes_notariales: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        seguro_riesgo: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        costes_registrales: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tasacion: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        comision_estudio: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        comision_activacion: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        seguro_desgravamen: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        localId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "locales",
                key: "id",
            },
        },
    },
    {
        tableName: "costos_iniciales",
        timestamps: true,
    }
);

export default CostoInicial;