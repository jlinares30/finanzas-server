import { Sequelize } from 'sequelize';
import { ENV } from './env.js';

const useSSL = process.env.NODE_ENV === 'production' ||
  (ENV.DB_HOST && ENV.DB_HOST.includes('render'));

console.log(`🔌 Conectando a Base de Datos: ${ENV.DB_HOST}`);
console.log(`🔒 Modo SSL: ${useSSL ? 'ACTIVADO' : 'DESACTIVADO (Local)'}`);

export const sequelize = new Sequelize(
  ENV.DB_NAME,
  ENV.DB_USER,
  ENV.DB_PASSWORD,
  {
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    dialect: 'postgres',
    logging: false,

    // Configuración condicional
    dialectOptions: useSSL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {} // Si es local, mandamos un objeto vacío (sin SSL)
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
  }
};

testConnection();