import { Sequelize } from 'sequelize';
import { ENV } from './env.js';

const isProduction = process.env.NODE_ENV === 'production' || (ENV.DB_HOST && ENV.DB_HOST.includes('render'));

export const sequelize = new Sequelize(
  ENV.DB_NAME,
  ENV.DB_USER,
  ENV.DB_PASSWORD,
  {
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    dialect: 'postgres',
    logging: false, // Evita llenar los logs de texto SQL

    // --- BLOQUE PARA 'ECONNRESET' ---
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
    // -------------------------------------------------------
  }
);

// Test de conexión para ver en los logs si tuvo éxito
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
};

testConnection();