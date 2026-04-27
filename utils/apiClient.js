// utils/apiClient.js
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native'; // Importamos Alert
import { router } from 'expo-router';

const BASE_URL = 'https://comedip.pythonanywhere.com/api/cliente';
//const BASE_URL = 'https://api.cemedip.net/api/cliente';


export const apiClient = async (endpoint, options = {}) => {
  const versionData = {
    app: 'estudiante',
    plataforma: Platform.OS,
    version: '1', // Probando con 0 para forzar el error
  };

  const headers = {
    'Content-Type': 'application/json',
    'versionamiento': JSON.stringify(versionData),
    ...(options.headers || {}),
  };

  const publicEndpoints = ['/seguridad/login/', '/seguridad/recuperar-contrasena/', '/seguridad/cambiar-contrasena/'];
  const isPublic = publicEndpoints.some(path => endpoint.includes(path));

  if (!isPublic) {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  // LOGS
  console.log(`%c >>> REQ: ${options.method || 'GET'} -> ${endpoint}`, 'color: cyan; font-weight: bold');

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`%c <<< RES: [${response.status}] <- ${endpoint}`, response.ok ? 'color: green' : 'color: red');

    if (response.status === 426) {
      const errorData = await response.json();

      Alert.alert(
        "Actualización Requerida", // Título
        errorData.message || "Debe actualizar a una versión más reciente para continuar.", // Mensaje del server
        [
          {
            text: "Entendido",
            onPress: () => console.log("Usuario avisado de actualización")
          }
        ],
        { cancelable: false } // Evita que cierren el pop-up tocando fuera de él
      );
    }

    // Manejo de expiración de token (401)
    if (response.status === 401 && !isPublic) {
      await SecureStore.deleteItemAsync('userToken');
      // Opcional: También podrías poner un Alert aquí diciendo "Sesión expirada"
      throw { status: 401, message: "Su token de sesión expiró" };
    }

    return response;
  } catch (error) {
    Alert.alert(
        "Sesión Expirada",
        "Su sesión ha finalizado. Por favor, ingrese nuevamente.",
        [{
          text: "OK",
          onPress: () => {
            // Usamos replace para que no puedan volver atrás con el botón físico
            // Y redirigimos a la ruta de login (ajusta el path si es distinto)
            router.replace('/login');
          }
        }]
      );

    throw error;
  }
};