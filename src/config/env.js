try {
  process.loadEnvFile();
} catch (error) {
  // Si el error es que no encuentra el archivo (ENOENT), no pasa nada.
  // Significa que estamos en Producción y las variables
  // ya están cargadas en el sistema.
  if (error.code !== 'ENOENT') {

    throw error;
  }
}

export const ENV = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME
};


