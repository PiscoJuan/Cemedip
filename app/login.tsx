import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function Login() {
  const router = useRouter();

  // State to hold user input
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State to manage the loading spinner
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingrese su usuario y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://comedip.pythonanywhere.com/api/cliente/seguridad/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          aplicacion: 'app',
        }),
      });

      const data = await response.json();

      // Check against your API's standard success structure
      if (data.status === 'success' && data.statusCode === 200) {

        // TODO: Save the token (data.data.token) and user info securely here.
        // E.g., using Expo SecureStore: await SecureStore.setItemAsync('userToken', data.data.token);

        // Navigate to the Dashboard
        router.replace('/dashboard'); // Using replace instead of push prevents them from going "back" to login

      } else {
        // Handle API-level errors (e.g., incorrect credentials)
        Alert.alert('Error', data.message || 'Credenciales incorrectas.');
      }
    } catch (error) {
      // Handle network errors
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Intente más tarde.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      {/* Logo centrado */}
      <Image
        source={require('../assets/images/logo.png')} // Asegúrate de que esta ruta sea correcta en tu proyecto
        style={{
          width: 120,
          height: 120,
          alignSelf: 'center',
          marginBottom: 30,
        }}
        resizeMode="contain"
      />

      <Text style={globalStyles.headerText}>INICIAR SESIÓN</Text>

      <Text style={globalStyles.label}>USUARIO</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Usuario (ej. correo@dominio.com)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={globalStyles.label}>CONTRASEÑA</Text>
      <TextInput
        style={[globalStyles.input, {marginBottom: 32}]}
        placeholder="************"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[globalStyles.primaryButton, isLoading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={globalStyles.primaryButtonText}>INGRESAR</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/recover-password')} disabled={isLoading}>
        <Text style={[globalStyles.linkText, {marginTop: 24 }]}>RECUPERAR CONTRASEÑA</Text>
      </TouchableOpacity>
    </View>
  );
}