import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // <-- Importación añadida
import { globalStyles } from '../constants/globalStyles';

export default function RecoverPassword() {
  const router = useRouter();

  // Estados
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Validaciones en tiempo real
  const validations = {
    hasMinLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasNumberOrSymbol: /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const getValidationColor = (isValid: boolean) => (isValid ? '#4FB0AB' : '#FF4D4D');

  const handleContinue = () => {
    // 1. Validar que coincidan
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    // 2. Validar requisitos
    if (!validations.hasMinLength || !validations.hasUpperCase || !validations.hasNumberOrSymbol) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos.');
      return;
    }

    // 3. LOGICA ORIGINAL: Navegar pasando el parámetro
    router.push({
      pathname: '/verify-code',
      params: { passwordToSave: newPassword }
    });
  };

  const isFormValid = validations.hasMinLength &&
                     validations.hasUpperCase &&
                     validations.hasNumberOrSymbol &&
                     newPassword === confirmPassword;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
      bounces={false}
    >
      {/* Aplicamos tu contenedor y el paddingTop al View interno */}
      <View style={[globalStyles.container, { paddingTop: 60 }]}>

        {/* Botón ATRÁS */}
        <TouchableOpacity style={globalStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#5F7282" />
          <Text style={globalStyles.backText}>ATRÁS</Text>
        </TouchableOpacity>

        <Text style={globalStyles.headerText}>RECUPERA TU CONTRASEÑA</Text>
        <Text style={[globalStyles.descriptionText, {marginTop: -40, marginBottom: 40}]}>
          Por favor, escribe tu nueva contraseña
        </Text>

        {/* Input Contraseña Nueva */}
        <Text style={globalStyles.label}>CONTRASEÑA NUEVA</Text>
        <View style={globalStyles.inputContainerBorder}>
          <TextInput
            style={globalStyles.input}
            placeholder="************"
            placeholderTextColor="#C1C1C1"
            secureTextEntry={!showPass}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={22} color="#5F7282" />
          </TouchableOpacity>
        </View>

        {/* Input Confirmar Contraseña */}
        <Text style={globalStyles.label}>INGRESE CONTRASEÑA DE NUEVO</Text>
        <View style={globalStyles.inputContainerBorder}>
          <TextInput
            style={globalStyles.input}
            placeholder="************"
            placeholderTextColor="#C1C1C1"
            secureTextEntry={!showConfirmPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
            <Ionicons name={showConfirmPass ? "eye-off-outline" : "eye-outline"} size={22} color="#5F7282" />
          </TouchableOpacity>
        </View>

        {/* Lista de Requisitos Dinámica */}
        <View style={globalStyles.requirementsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#5F7282" />
            <Text style={[globalStyles.requirementTitle, { marginBottom: 0, marginLeft: 5 }]}>
              TU CONTRASEÑA DEBE TENER:
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={validations.hasMinLength ? "checkmark-circle" : "close-circle"}
              size={16}
              color={getValidationColor(validations.hasMinLength)}
            />
            <Text style={[globalStyles.requirementText, { color: getValidationColor(validations.hasMinLength), marginLeft: 8 }]}>
              Tener al menos 8 caracteres.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={validations.hasUpperCase ? "checkmark-circle" : "close-circle"}
              size={16}
              color={getValidationColor(validations.hasUpperCase)}
            />
            <Text style={[globalStyles.requirementText, { color: getValidationColor(validations.hasUpperCase), marginLeft: 8 }]}>
              Tener una letra Mayúscula.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={validations.hasNumberOrSymbol ? "checkmark-circle" : "close-circle"}
              size={16}
              color={getValidationColor(validations.hasNumberOrSymbol)}
            />
            <Text style={[globalStyles.requirementText, { color: getValidationColor(validations.hasNumberOrSymbol), marginLeft: 8 }]}>
              Tener un número o símbolo.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            !isFormValid && { opacity: 0.5, backgroundColor: '#CCC' }
          ]}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}