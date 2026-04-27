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

  // useFocusEffect recarga la lista cada vez que el usuario entra a esta pantalla
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
      console.log("API Response:", data);
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

  const renderExamItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={globalStyles.card}
      onPress={() => {
        router.push({
          pathname: '/exam-welcome',
          params: { id_examen: item.id_examen }
        });
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#5F7282', marginBottom: 5 }}>
            {item.nombre.toUpperCase()}
          </Text>
          <Text style={{ color: '#9D489E', fontSize: 12, marginBottom: 5 }}>
            {item.estado === 'en_progreso' ? 'EN PROGRESO' : 'PENDIENTE'}
          </Text>
          <Text style={{ color: '#A0AAB2', fontSize: 12 }}>
            Fecha límite: {formatDate(item.fecha_entrega)}
          </Text>
          <Text style={{ color: '#A0AAB2', fontSize: 12 }}>
            Preguntas: {item.numero_preguntas} | Tiempo: {item.duracion_minutos} min
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9D489E" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <View style={{ flex: 1, paddingHorizontal: 25, paddingTop: 10 }}>

        {/* AQUÍ ESTÁ EL CAMBIO: Título + Botón Historial */}
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