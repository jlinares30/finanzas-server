import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Hogar = sequelize.define(
    "Hogar",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        num_personas: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tipo_vivienda: {
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
        tableName: "hogares",
        timestamps: true,
    }
);

export default Hogar;