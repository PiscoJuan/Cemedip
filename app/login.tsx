import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";

export default function Login() {
  const router = useRouter();

  // Estados
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingrese su usuario y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient('/seguridad/login/', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          aplicacion: 'app',
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.statusCode === 200) {
        await SecureStore.setItemAsync('userToken', data.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(data.data.usuario));
        router.replace('/dashboard');
      } else {
        Alert.alert('Error', data.message || 'Credenciales incorrectas.');
      }
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true} // Obligatorio para que Expo/Android lo reconozca
      extraScrollHeight={20} // Da un pequeño margen para que el input no quede pegado al teclado
      bounces={false} // Evita el efecto rebote molesto en iOS
    >
      <View style={globalStyles.container}>
        {/* Logo */}
        <Image
          source={require('../assets/images/logo.png')}
          style={globalStyles.logo}
          resizeMode="contain"
        />

        <Text style={globalStyles.headerText}>INICIAR SESIÓN</Text>

        {/* Input Usuario */}
        <Text style={globalStyles.label}>USUARIO</Text>
        <View style={globalStyles.inputContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="USUARIO"
            placeholderTextColor="#A0AAB2"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* Input Contraseña */}
        <Text style={globalStyles.label}>CONTRASEÑA</Text>
        <View style={globalStyles.inputContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="************"
            placeholderTextColor="#A0AAB2"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#5F7282"
            />
          </TouchableOpacity>
        </View>

        {/* Botón Ingresar */}
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

        <TouchableOpacity
          onPress={() => router.push('/request-reset')}
          disabled={isLoading}
        >
          <Text style={globalStyles.linkText}>RECUPERAR CONTRASEÑA</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}