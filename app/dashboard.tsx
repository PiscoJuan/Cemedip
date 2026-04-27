import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { globalStyles } from '../constants/globalStyles';
import { CustomDrawer } from '../components/CustomDrawer';
import { BottomNavbar } from '../components/BottomNavbar';
import { router, useFocusEffect } from "expo-router";
import { MainHeader } from "@/components/MainHeader";
import { apiClient } from "@/utils/apiClient";

export default function Dashboard() {
  const [userName, setUserName] = useState('USUARIO');
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUser(), fetchPending()]);
    } catch (error) {
      console.log("Error al recargar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      return () => {};
    }, [])
  );

  const loadUser = async () => {
    const data = await SecureStore.getItemAsync('userData');
    if (data) {
      const user = JSON.parse(data);
      setUserName((user.nombre_completo?.split(' ')[0] || 'USUARIO').toUpperCase());
    }
  };

  const fetchPending = async () => {
    try {
      const response = await apiClient('/evaluaciones/training/');
      const data = await response.json();
      setPendingTrainings(data.data || data || []);
    } catch (error) {
      console.log("Error fetching pending:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '00/00/0000 00:00';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  const calculatePercentage = (current, total) => {
    if (!total || total === 0) return 0;
    const completedCount = Math.max(0, current - 1);
    return Math.round((completedCount / total) * 100);
  };

  const renderProgressItem = ({ item }) => (
    <TouchableOpacity
      style={globalStyles.progressItemCard}
      onPress={() => router.push({
        pathname: '/training-exam',
        params: {
          trainingId: item.id_intento,
          totalLimit: String(item.total_preguntas || item.numero_preguntas),
          startPage: String(item.indice_pregunta_actual || 1)
        }
      })}
    >
      <View style={globalStyles.progressSideBar} />
      <View style={globalStyles.progressContent}>
        <View style={globalStyles.progressIconCircle}>
          <Image
            source={require('../assets/images/Recurso 11.png')}
            style={{ width: 25, height: 25, opacity: 0.5 }}
            resizeMode="contain"
          />
        </View>
        <View style={globalStyles.progressInfoContainer}>
          <Text style={globalStyles.progressMainText}>TRAINING</Text>
          <Text style={globalStyles.progressSecondaryText}>
            {item.especialidades && item.especialidades.length > 0
              ? item.especialidades.map(esp => esp.nombre).join(', ')
              : 'GENERAL'}
          </Text>
          <Text style={globalStyles.progressDateText}>{formatDate(item.fecha_creacion)}</Text>
        </View>
        <Text style={globalStyles.progressPercentageText}>
          {calculatePercentage(item.indice_pregunta_actual || 0, item.total_preguntas || item.numero_preguntas)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <Text style={globalStyles.welcomeText}>BIENVENIDO, {userName}!</Text>

        <TouchableOpacity
          style={globalStyles.actionCard}
          onPress={() => router.push('/training-setup')}
        >
          <View style={globalStyles.actionCardCircle}>
            <Image source={require('../assets/images/Recurso 11.png')} style={globalStyles.actionCardIcon} resizeMode="contain" />
          </View>
          <Text style={globalStyles.actionCardTitle}>TRAINING</Text>
          <Ionicons name="chevron-forward" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={globalStyles.actionCard}
          onPress={() => {
            router.push('/exam-list')
            // Alert.alert("Aviso", "No hay exámenes disponibles en este momento.");
          }}
        >
          <View style={globalStyles.actionCardCircle}>
            <Image source={require('../assets/images/Recurso 12.png')} style={globalStyles.actionCardIcon} resizeMode="contain" />
          </View>
          <Text style={globalStyles.actionCardTitle}>EXAMEN</Text>
          <Ionicons name="chevron-forward" size={30} color="white" />
        </TouchableOpacity>

        <Text style={globalStyles.sectionTitle}>PROGRESO</Text>
      </View>

      <FlatList
        data={pendingTrainings}
        keyExtractor={(item) => item.id_intento.toString()}
        renderItem={renderProgressItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          !isLoading && (
            <Text style={{ color: '#A0AAB2', textAlign: 'center', marginTop: 20 }}>
              No tienes entrenamientos pendientes.
            </Text>
          )
        }
        ListHeaderComponent={isLoading ? <ActivityIndicator color="#9D489E" style={{ marginVertical: 10 }} /> : null}
      />

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}