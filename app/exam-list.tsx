import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { MainHeader } from "@/components/MainHeader";
import { CustomDrawer } from '../components/CustomDrawer';

export default function ExamList() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchExams();
    }, [])
  );

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient('/evaluaciones/examen/');
      const data = await response.json();
      if (response.ok || data.status === 'success') {
        setExams(data.data || []);
      } else {
        Alert.alert('Error', data.error || 'No se pudieron cargar los exámenes.');
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      Alert.alert('Error', 'Problema de conexión al cargar los exámenes.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderExamItem = ({ item }: { item: any }) => {
    const isAgotado = item.estado_participacion === 'agotado';

    const isEnProgreso = item.estado === 'en_prgoreso' || item.estado === 'en_progreso';

    const isDisponible = isEnProgreso && !isAgotado;

    let statusText = '';
    let statusColor = '';
    let iconName: keyof typeof Ionicons.glyphMap = 'time';

    if (isDisponible) {
      statusText = 'DISPONIBLE AHORA';
      statusColor = '#00C9A7';
      iconName = 'play-circle';
    } else if (isAgotado) {
      statusText = 'INTENTOS AGOTADOS';
      statusColor = '#FF3B30';
      iconName = 'lock-closed';
    } else {
      statusText = 'PRÓXIMO';
      statusColor = '#9D489E';
      iconName = 'time';
    }

    return (
      <TouchableOpacity
        style={[globalStyles.card, { opacity: isDisponible ? 1 : 0.6 }]}
        onPress={() => {
          if (isDisponible) {
            router.push({
              pathname: '/exam-welcome',
              params: { id_examen: item.id_examen }
            });
          } else if (isAgotado) {
            Alert.alert(
              'Intentos Agotados',
              'Ya has agotado todos los intentos permitidos para este examen. Puedes revisar tus resultados en el Historial.'
            );
          } else {
            Alert.alert(
              'Examen no disponible',
              'Este examen se encuentra en estado PRÓXIMO y aún no puedes iniciarlo.'
            );
          }
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#5F7282', marginBottom: 5 }}>
              {item.nombre.toUpperCase()}
            </Text>
            <Text style={{ color: statusColor, fontSize: 12, marginBottom: 5, fontWeight: 'bold' }}>
              {statusText}
            </Text>
            <Text style={{ color: '#A0AAB2', fontSize: 12 }}>
              Cierra: {formatDate(item.fecha_entrega)}
            </Text>
            <Text style={{ color: '#A0AAB2', fontSize: 12 }}>
              Preguntas: {item.numero_preguntas} | Tiempo: {item.duracion_minutos} min
            </Text>
          </View>
          <Ionicons name={iconName} size={32} color={isDisponible ? "#9D489E" : "#A0AAB2"} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[globalStyles.headerText, { marginBottom: 0, textAlign: 'left', fontSize: 22 }]}>
            EXÁMENES
          </Text>
          <TouchableOpacity style={globalStyles.historialButton} onPress={() => router.push('/exam-history')}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#9D489E" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={exams}
            keyExtractor={(item) => item.id_examen.toString()}
            renderItem={renderExamItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#5F7282' }}>
                No tienes exámenes pendientes en este momento.
              </Text>
            }
          />
        )}
      </View>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}