import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const CostoPeriodico = sequelize.define(
    "CostoPeriodico",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // aplica si hay seguro contra todo riesgo en la cuota recurrente
        seguro_contra_todo_riesgo: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        comision_periodica: {
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
        tableName: "costos_periodicos",
        timestamps: true,
    }
);

export default CostoPeriodico;