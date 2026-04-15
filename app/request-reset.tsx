import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";

export default function RequestReset() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!correo) {
      Alert.alert('Error', 'Por favor, ingrese su correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient('/seguridad/recuperar-contrasena/', {
        method: 'POST',
        body: JSON.stringify({ correo: correo.trim() }),
      });

      const data = await response.json();

      if (response.ok || data.status === 'success' || data.statusCode === 200) {
        router.push('/recover-password');
      } else {
        const errorMessage = data.error || data.message || data.detail || 'Ocurrió un error en el servidor.';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de conexión con el servidor.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
      bounces={false}
    >
      <View style={globalStyles.container}>
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#5F7282" />
          <Text style={globalStyles.backText}>ATRÁS</Text>
        </TouchableOpacity>

        <Text style={globalStyles.headerText}>RECUPERA TU CONTRASEÑA</Text>

        <Text style={[globalStyles.descriptionText, { marginTop: -40, marginBottom: 50 }]}>
          Ingresa tu correo para recibir un código
        </Text>

        <Text style={globalStyles.label}>CORREO ELECTRÓNICO</Text>

        <View style={globalStyles.inputContainer}>
          <TextInput
            style={globalStyles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#C1C1C1"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            isLoading && { opacity: 0.7 },
            { marginTop: 10 }
          ]}
          onPress={handleRequestCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>ENVIAR CÓDIGO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <Text style={globalStyles.linkText}>VOLVER AL LOGIN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}