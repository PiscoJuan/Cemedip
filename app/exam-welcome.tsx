import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';

export default function ExamWelcome() {
  const router = useRouter();
  const { id_examen } = useLocalSearchParams(); // Recibe el ID del examen a dar
  const [isLoading, setIsLoading] = useState(false);

  const handleIniciar = async () => {
    if (!id_examen) {
      Alert.alert('Error', 'No se ha especificado un examen.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient('/evaluaciones/examen/', {
        method: 'POST',
        body: JSON.stringify({ id_examen: parseInt(id_examen as string) })
      });
      const data = await response.json();

      if (response.ok || data.status === 'success') {
        const intentoData = data.data;
        if (intentoData.estado_participacion === 'agotado') {
          Alert.alert('Aviso', 'Ya has agotado tus intentos para este examen.');
          return;
        }

        router.replace({
          pathname: '/exam-session',
          params: {
            id_intento: data.data.id_intento,
            duracion_minutos: data.data.duracion_minutos,
            total_preguntas: data.data.total_preguntas,
            fecha_creacion: data.data.fecha_creacion,
            cuestionario_str: JSON.stringify(data.data.cuestionario)
          }
        });
      } else {
        // --- AQUÍ ESTÁ LA CORRECCIÓN ---
        // Buscamos primero en data.error, luego en data.message, y si no hay nada ponemos un default
        const errorMsg = data.error || data.message || 'No se pudo iniciar el examen.';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error de Red', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="menu" size={35} color="#9D489E" /></TouchableOpacity>
        <TouchableOpacity><Ionicons name="person-circle-outline" size={40} color="#9D489E" /></TouchableOpacity>
      </View>

      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../assets/images/Recurso 12.png')} // Tu icono de examen
          style={{ width: 120, height: 120, opacity: 0.7, marginBottom: 30 }}
          resizeMode="contain"
        />

        <Text style={[globalStyles.headerText, { marginBottom: 15, fontSize: 28 }]}>
          BIENVENIDO AL EXAMEN
        </Text>

        <Text style={[globalStyles.descriptionText, { marginTop: 0, paddingHorizontal: 20, fontSize: 14 }]}>
          Verifica tu conexión y lee cada pregunta con atención. Tienes un tiempo limitado.
        </Text>

        <TouchableOpacity
          style={[globalStyles.primaryButton, { width: '80%', marginTop: 40 }]}
          onPress={handleIniciar}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>INICIAR</Text>}
        </TouchableOpacity>
      </View>

      <BottomNavbar />
    </SafeAreaView>
  );
}