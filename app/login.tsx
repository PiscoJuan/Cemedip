import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { useAuth } from "@/utils/authContext";

export default function Login() {
  const { logIn } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Estados para el Modal de Aviso Importante
  const [showAviso, setShowAviso] = useState(false);
  const [avisoTexto, setAvisoTexto] = useState('');
  const [isLoadingAviso, setIsLoadingAviso] = useState(true);

  useEffect(() => {
    fetchAvisoIndependencia();
  }, []);

  const fetchAvisoIndependencia = async () => {
    try {
      // Endpoint público (ajusta la ruta si requiere token o un path diferente en tu apiClient)
      const response = await apiClient('/politicas/independencia/');
      const data = await response.json();
      if (data.status === 'success') {
        setAvisoTexto(data.data.contenido_texto);
        setShowAviso(true); // Mostramos el modal automáticamente
      }
    } catch (error) {
      console.log('Error fetching aviso:', error);
    } finally {
      setIsLoadingAviso(false);
    }
  };

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
        await logIn(data.data.token, data.data.usuario);

        // Redirigir a completar perfil si los datos están incompletos
        if (data.data.usuario.datos_incompletos) {
          Alert.alert('Aviso', 'Por favor, completa tus datos y acepta los términos para continuar.');
          router.replace('/profile-edit');
        }
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
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
        bounces={false}
      >
        <View style={globalStyles.container}>
          <Image
            source={require('../assets/images/logo.png')}
            style={globalStyles.logo}
            resizeMode="contain"
          />

          <Text style={globalStyles.headerText}>INICIAR SESIÓN</Text>

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
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#5F7282"
              />
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity onPress={() => router.push('/request-reset')} disabled={isLoading}>
            <Text style={globalStyles.linkText}>RECUPERAR CONTRASEÑA</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Modal de Aviso Importante */}
      <Modal visible={showAviso} transparent animationType="fade">
        <View style={globalStyles.modalOverlay}>
          <View style={[globalStyles.modalContent, { padding: 25 }]}>
            <Text style={globalStyles.modalTitle}>AVISO IMPORTANTE</Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }} showsVerticalScrollIndicator={true}>
              <Text style={{ fontSize: 14, color: '#5F7282', lineHeight: 22, textAlign: 'justify' }}>
                {avisoTexto || 'Cargando información...'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%', marginTop: 10, marginHorizontal: 0 }]}
              onPress={() => setShowAviso(false)}
            >
              <Text style={globalStyles.primaryButtonText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}