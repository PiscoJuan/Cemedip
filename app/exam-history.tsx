import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { CustomDrawer } from '../components/CustomDrawer';
import { MainHeader } from "@/components/MainHeader";

export default function ExamHistory() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await apiClient('/evaluaciones/examen/historial/');
      const data = await response.json();
      if (response.ok || data.status === 'success') {
        setHistory(data.data || []);
      }
      console.log("API Response:", data);
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el historial de exámenes.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={globalStyles.historyCard}>
      <View style={globalStyles.historyIconCircle}>
        <Image source={require('../assets/images/Recurso 12.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
      </View>

      <View style={globalStyles.historyInfoContainer}>
        <Text style={globalStyles.historyTitleText}>{item.nombre.toUpperCase()}</Text>
        <Text style={globalStyles.historySubTitleText}>
          {item.numero_preguntas} PREGUNTAS | CERRÓ: {formatDate(item.fecha_entrega)}
        </Text>

        {item.participo && item.resultado ? (
          <Text style={{ fontSize: 11, color: '#00C9A7', fontWeight: 'bold', marginTop: 4 }}>
            PUNTAJE: {item.resultado.puntaje_obtenido} / {item.puntaje_maximo} ({item.resultado.porcentaje}%)
          </Text>
        ) : (
          <Text style={{ fontSize: 11, color: '#FF3B30', fontWeight: 'bold', marginTop: 4 }}>
            NO PARTICIPÓ
          </Text>
        )}
      </View>

      {item.participo && (
        <TouchableOpacity
          style={globalStyles.historyVerMasButton}
          onPress={() => {
             // Opcional: Crear pantalla de detalle '/exam-history-detail' usando el endpoint de ID
             Alert.alert('Pronto', `Detalle del examen ID: ${item.id_examen}`);
          }}
        >
          <Text style={globalStyles.historyVerMasText}>REVISAR</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <View style={{ flex: 1, paddingHorizontal: 25 }}>
        <Text style={[globalStyles.headerText, { marginBottom: 20, textAlign: 'left' }]}>
          HISTORIAL EXÁMENES
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#9D489E" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id_examen.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#5F7282' }}>
                No hay historial de exámenes.
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