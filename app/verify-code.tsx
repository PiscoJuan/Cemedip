import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";

export default function VerifyCode() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { passwordToSave } = params;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient('/seguridad/confirmar-recuperacion-contrasena/', {
        method: 'POST',
        body: JSON.stringify({
          token: code,
          nueva_contrasena: passwordToSave
        }),
      });

      const data = await response.json();

      if (response.ok || data.status === 'success') {
        Alert.alert('Éxito', 'Contraseña restablecida correctamente.');
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message || 'Código inválido.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View key={i} style={[globalStyles.otpBox, { width: 45, height: 70 }]}>
          <Text style={[globalStyles.otpText, { fontSize: 28 }]}>
            {code[i] || ""}
          </Text>
        </View>
      );
    }
    return boxes;
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
        <TouchableOpacity style={globalStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#5F7282" />
          <Text style={globalStyles.backText}>ATRÁS</Text>
        </TouchableOpacity>

        <Text style={globalStyles.headerText}>REVISA TU CORREO ELECTRÓNICO</Text>
        <Text style={[globalStyles.descriptionText, { marginTop: -40, marginBottom: 30 }]}>
          Enviamos un código de verificación a tu correo
        </Text>

        <View style={globalStyles.otpContainer}>
          {renderOtpBoxes()}

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={setCode}
            maxLength={6}
            keyboardType="number-pad"
            autoFocus={true}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0,
            }}
          />
        </View>

        <Text style={globalStyles.timerText}>
          El código expira en: <Text style={{ fontWeight: 'bold' }}>10:00 min.</Text>
        </Text>

        <TouchableOpacity
          style={[globalStyles.primaryButton, isLoading && { opacity: 0.7 }]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>VERIFICAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.secondaryButton} onPress={() => Alert.alert("Reenviado", "Código nuevo enviado.")}>
          <Text style={globalStyles.secondaryButtonText}>ENVIAR DE NUEVO</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}