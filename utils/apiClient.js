// utils/apiClient.js
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = 'https://comedip.pythonanywhere.com/api/cliente';

export const apiClient = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'app': 'estudiante',
    'plataforma': Platform.OS,
    'version': '2',
    ...(options.headers || {}),
  };

  // 1. Definimos qué rutas NO necesitan token (públicas)
  const publicEndpoints = [
    '/seguridad/login/',
    '/seguridad/recuperar-contrasena/',
    '/seguridad/cambiar-contrasena/'
  ];

  // 2. Solo buscamos y ponemos el token si la ruta NO es pública
  const isPublic = publicEndpoints.some(path => endpoint.includes(path));

  if (!isPublic) {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 3. Tip Extra: Si el servidor dice que el token caducó (401) en una ruta privada,
  // borramos el token para que la próxima vez entre como "limpio"
  if (response.status === 401 && !isPublic) {
    await SecureStore.deleteItemAsync('userToken');
    // Aquí podrías incluso redirigir al login si usas un manejador global
  }

  return response;
};