import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { globalStyles } from '../constants/globalStyles';
import {apiClient} from "@/utils/apiClient";

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await SecureStore.getItemAsync('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);

          let displayName = userData.nombre_completo || userData.username || 'USUARIO';

          if (userData.nombre_completo) {
            displayName = userData.nombre_completo.split(' ')[0];
          }

          setUserName(displayName.toUpperCase());
        }
      } catch (error) {
        console.error("Error al cargar los datos del usuario", error);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const token = await SecureStore.getItemAsync('userToken');

      if (token) {
        await apiClient('/seguridad/logout/', {
          method: 'POST',
        });
      }

      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');

      router.replace('/login');

    } catch (error) {
      console.error('Error durante el logout:', error);
      Alert.alert('Error', 'Hubo un problema al cerrar la sesión.');
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerText}>BIENVENIDO, {userName}!</Text>

      <TouchableOpacity style={globalStyles.card} onPress={() => router.push('/training-setup')}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>TRAINING</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.card} onPress={() => router.push('/online-exam')}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>EXAMEN</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>PROGRESO</Text>
      <View style={globalStyles.card}>
        <Text>EXAMEN DE PRÁCTICA - 50% - 06/04/2026</Text>
      </View>

      <TouchableOpacity
        style={[globalStyles.primaryButton, { backgroundColor: '#FF3B30', marginTop: 40 }]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={globalStyles.primaryButtonText}>LOGOUT TEMPORAL</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}