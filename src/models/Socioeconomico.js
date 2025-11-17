import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Socioeconomico = sequelize.define(
    "Socioeconomico",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        ocupacion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ingresos_mensuales: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tipo_contrato: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        nivel_esducativo: {
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
    },
    {
        tableName: "socioeconomicos",
        timestamps: true,
    }
);

export default Socioeconomico;