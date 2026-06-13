// Configuración de la aplicación
export const API_URL = process.env.API_URL || 'https://fap-backend-q75z.onrender.com';

export const config = {
  apiUrl: API_URL,
  apiTimeout: 30000, // 30 segundos
  paginationLimit: 20,
  sessionTimeout: 1800000, // 30 minutos en milisegundos
};
