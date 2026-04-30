import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native'; // Importamos Alert
import { router } from 'expo-router';

//const BASE_URL = 'https://comedip.pythonanywhere.com/api/cliente';
const BASE_URL = 'https://api.cemedip.net/api/cliente';


export const apiClient = async (endpoint, options = {}) => {
  const versionData = {
    app: 'estudiante',
    plataforma: Platform.OS,
    version: '2',
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

    // try {
    //   const clonedResponse = response.clone();
    //   const responseData = await clonedResponse.text(); // Leemos como texto primero por si acaso no es JSON
    //
    //   const jsonData = responseData ? JSON.parse(responseData) : {};
    //   console.log(`%c <<< DATA: <- ${endpoint}`, 'color: magenta', jsonData);
    // } catch (parseError) {
    //   console.log(`%c <<< DATA: <- ${endpoint} (Raw Text)`, 'color: gray');
    // }
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

    if (response.status === 401 && !isPublic) {
      await SecureStore.deleteItemAsync('userToken');
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
            router.replace('/login');
          }
        }]
      );

    throw error;
  }
};