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
        costes_notariales: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        // si es pago unico aplica seguro de riesgo en la cuota inicial
        seguro_riesgo: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
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