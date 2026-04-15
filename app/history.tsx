import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Image,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { CustomDrawer } from '../components/CustomDrawer';

export default function HistoryScreen() {
  const router = useRouter();

  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await apiClient('/evaluaciones/training/historial/');
      const data = await response.json();
      const results = data.data || data || [];
      setHistory(results);
      setFilteredHistory(results);
    } catch (error) {
      console.error("Error fetching history:", error);
      Alert.alert("Error", "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = history.filter((item) =>
      item.especialidad_nombre?.toLowerCase().includes(text.toLowerCase()) ||
      item.tema_nombre?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredHistory(filtered);
  };

  const handleVerMas = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const response = await apiClient(`/evaluaciones/training/historial/${id}/`);
      const data = await response.json();

      setSelectedDetail(data.data || data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error detalle:", error);
      Alert.alert("Error", "No se pudo obtener el detalle del examen.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '00/00/0000';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const renderItem = ({ item }) => (
    <View style={globalStyles.historyCard}>
      <View style={globalStyles.historyIconCircle}>
        <Image
          source={require('../assets/images/Recurso 11.png')}
          style={{ width: 26, height: 26 }}
          resizeMode="contain"
        />
      </View>

      <View style={globalStyles.historyInfoContainer}>
        <Text style={globalStyles.historyTitleText}>EXAMEN DE PRÁCTICA</Text>
        <Text style={globalStyles.historySubTitleText}>
          {item.especialidad_nombre || 'ESPECIALIDAD'}, {item.tema_nombre || 'TEMA'}
        </Text>
        <Text style={globalStyles.historyDateText}>{formatDate(item.fecha_creacion)}</Text>
      </View>

      <TouchableOpacity
        style={globalStyles.historyVerMasButton}
        onPress={() => handleVerMas(item.id || item.id_intento || item.pk)}
      >
        <Text style={globalStyles.historyVerMasText}>VER MÁS</Text>
      </TouchableOpacity>
    </View>
  );

  if (isReviewMode && selectedDetail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={35} color="#9D489E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.dismissAll();
            }
            router.replace('/dashboard');}
          }>
             <Ionicons name="person-circle-outline" size={40} color="#9D489E" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ padding: 25 }}>
            <Text style={[globalStyles.headerText, { textAlign: 'left', marginBottom: 5, fontSize: 22 }]}>
              REVISIÓN DEL EXAMEN
            </Text>
            <Text style={{ color: '#A0AAB2', marginBottom: 20, fontWeight: 'bold' }}>
              {selectedDetail.intento?.porcentaje}% OBTENIDO
            </Text>

            {selectedDetail.preguntas?.map((preg, index) => (
              <View key={preg.id_pregunta || index} style={{ marginBottom: 35 }}>
                <Text style={{ fontWeight: 'bold', color: '#9D489E', fontSize: 16, marginBottom: 10 }}>
                  PREGUNTA {preg.orden || index + 1}
                </Text>
                <Text style={[globalStyles.questionText, { fontSize: 18, lineHeight: 24, marginBottom: 20 }]}>
                  {preg.enunciado}
                </Text>

                {preg.alternativas && preg.alternativas.map((opcion) => {
                  let bgColor = '#F0F2F3';
                  let txtColor = '#5F7282';

                  if (opcion.es_correcta) {
                    bgColor = '#00C9A7';
                    txtColor = '#FFF';
                  } else if (opcion.seleccionada) {
                    bgColor = '#FF3B30';
                    txtColor = '#FFF';
                  }

                  return (
                    <View key={opcion.id_alternativa_intento} style={[globalStyles.optionButton, { backgroundColor: bgColor, marginBottom: 12, padding: 18, borderRadius: 12 }]}>
                      <Text style={{ color: txtColor, fontWeight: '600' }}>
                        {opcion.identificador_letra ? `${opcion.identificador_letra.toUpperCase()}) ` : ''}{opcion.contenido}
                      </Text>
                    </View>
                  );
                })}

                <View style={{ marginTop: 15, padding: 20, backgroundColor: '#F8F9FA', borderRadius: 15, borderWidth: 2, borderColor: preg.es_correcta ? '#00C9A7' : '#FF3B30' }}>
                  <Text style={{ fontWeight: 'bold', color: preg.es_correcta ? '#00C9A7' : '#FF3B30', marginBottom: 8, fontSize: 16 }}>
                    {preg.es_correcta ? 'RESPONDIÓ CORRECTAMENTE' : 'RESPONDIÓ INCORRECTAMENTE'}
                  </Text>
                  <Text style={{ color: '#5F7282', lineHeight: 20 }}>
                    {preg.justificacion || preg.feedback?.justificacion || 'Sin explicación detallada.'}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[globalStyles.primaryButton, { marginTop: 20 }]}
              onPress={() => setIsReviewMode(false)}
            >
              <Text style={globalStyles.primaryButtonText}>VOLVER AL HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <BottomNavbar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={38} color="#9D489E" />
        </TouchableOpacity>
        <Ionicons name="person-circle-outline" size={42} color="#9D489E" />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 25 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={[globalStyles.headerText, { marginBottom: 0, textAlign: 'left' }]}>
            HISTORIAL TRAINING
          </Text>
        </View>

        <View style={globalStyles.searchSection}>
          <TextInput
            style={{ flex: 1, height: '100%', color: '#5F7282' }}
            placeholder="Buscar"
            placeholderTextColor="#A0AAB2"
            value={search}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color="#A0AAB2" />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#9D489E" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item, index) => {
                const id = item?.id || item?.id_intento || item?.pk;
                return id ? id.toString() : index.toString();
            }}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#5F7282' }}>
                No hay entrenamientos previos.
              </Text>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={globalStyles.modalOverlay}>
          <View style={[globalStyles.modalContent, { maxHeight: '85%' }]}>

            <Text style={[globalStyles.modalTitle, { marginBottom: 5 }]}>RESULTADOS</Text>
            <Text style={{ color: '#A0AAB2', fontSize: 12, marginBottom: 20 }}>
              {selectedDetail?.intento?.fecha_finalizacion
                ? formatDate(selectedDetail.intento.fecha_finalizacion)
                : ''}
            </Text>

            <View style={globalStyles.resultScoreCard}>
              <Text style={globalStyles.resultPercent}>{selectedDetail?.intento?.porcentaje}%</Text>
              <Text style={globalStyles.resultSubText}>Puntaje Obtenido</Text>

              <View style={globalStyles.resultBadgeRow}>
                <View style={[globalStyles.resultBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={[globalStyles.resultBadgeText, { color: '#4CAF50' }]}>
                    {selectedDetail?.intento?.correctas} Correctas
                  </Text>
                </View>
                <View style={[globalStyles.resultBadge, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={[globalStyles.resultBadgeText, { color: '#F44336' }]}>
                    {selectedDetail?.intento?.total_preguntas - selectedDetail?.intento?.correctas} Incorrectas
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{ alignSelf: 'flex-start', fontWeight: 'bold', color: '#5F7282', marginBottom: 10 }}>
              REVISIÓN RÁPIDA
            </Text>

            <ScrollView style={{ width: '100%', flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              {selectedDetail?.preguntas?.map((preg, index) => (
                <View key={index} style={globalStyles.questionReviewRow}>
                  <View style={[globalStyles.orderBadge, { backgroundColor: preg.es_correcta ? '#4CAF50' : '#F44336' }]}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>{preg.orden}</Text>
                  </View>
                  <Text style={globalStyles.questionTextSnippet} numberOfLines={2}>
                    {preg.enunciado}
                  </Text>
                  <Ionicons
                    name={preg.es_correcta ? "checkmark-circle" : "close-circle"}
                    size={22}
                    color={preg.es_correcta ? "#4CAF50" : "#F44336"}
                  />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%', marginHorizontal: 0, marginTop: 20 }]}
              onPress={() => {
                setModalVisible(false);
                setIsReviewMode(true);
              }}
            >
              <Text style={globalStyles.primaryButtonText}>VER EXAMEN COMPLETO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%', marginHorizontal: 0, marginTop: 10, backgroundColor: '#5F7282' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={globalStyles.primaryButtonText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loadingDetail && (
        <View style={globalStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#9D489E" />
        </View>
      )}

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}