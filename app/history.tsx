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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { CustomDrawer } from '../components/CustomDrawer';
import { MainHeader } from "@/components/MainHeader";

export default function HistoryScreen() {
  const router = useRouter();

  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportQuestionData, setReportQuestionData] = useState({ id: null, orden: null });

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

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = history.filter((item: any) =>
      item.especialidad_nombre?.toLowerCase().includes(text.toLowerCase()) ||
      item.tema_nombre?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredHistory(filtered);
  };

  const handleVerMas = async (id: any) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const response = await apiClient(`/evaluaciones/training/historial/${id}/`);
      const data = await response.json();
      const detail = data.data || data;

      setSelectedDetail(detail);
      setModalVisible(true);
    } catch (error) {
      console.error("Error detalle:", error);
      Alert.alert("Error", "No se pudo obtener el detalle.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
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

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Atención", "Por favor ingresa una razón para el reporte.");
      return;
    }

    if (!reportQuestionData.id) {
      Alert.alert("Error", "No se pudo identificar la pregunta actual.");
      return;
    }

    setIsReporting(true);
    try {
      const response = await apiClient('/evaluaciones/reportes/', {
        method: 'POST',
        body: JSON.stringify({
          id_intento_pregunta: reportQuestionData.id,
          razon: reportReason.trim()
        })
      });

      const data = await response.json();

      if (response.ok || data.status === 'success') {
        Alert.alert("Éxito", "El reporte ha sido enviado. ¡Gracias por tu feedback!");
        setReportModalVisible(false);
        setReportReason('');

        if (selectedDetail && selectedDetail.preguntas) {
          const updatedPreguntas = selectedDetail.preguntas.map((p: any) =>
            p.id_intento_pregunta === reportQuestionData.id ? { ...p, es_reportada: true } : p
          );
          setSelectedDetail({ ...selectedDetail, preguntas: updatedPreguntas });
        }
      } else {
        Alert.alert("Error", data.message || "No se pudo enviar el reporte.");
      }
    } catch (error) {
      Alert.alert("Error", "Fallo de conexión al enviar el reporte.");
    } finally {
      setIsReporting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={globalStyles.historyCard}>
      <View style={globalStyles.historyIconCircle}>
        <Image
          source={require('../assets/images/Recurso 11.png')}
          style={{ width: 26, height: 26 }}
          resizeMode="contain"
        />
      </View>

      <View style={globalStyles.historyInfoContainer}>
        <Text style={globalStyles.historyTitleText}>TRAINING</Text>
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
        <MainHeader
          onOpenMenu={() => setMenuVisible(true)}
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ padding: 25 }}>
            <Text style={[globalStyles.headerText, { textAlign: 'left', marginBottom: 5, fontSize: 22 }]}>
              REVISIÓN DEL TRAINING
            </Text>
            <Text style={{ color: '#A0AAB2', marginBottom: 20, fontWeight: 'bold' }}>
              {selectedDetail.intento?.porcentaje}% OBTENIDO
            </Text>

            {selectedDetail.preguntas?.map((preg: any, index: number) => (
              <View key={preg.id_intento_pregunta || preg.id_pregunta || index} style={{ marginBottom: 35 }}>

                {/* CABECERA DE LA PREGUNTA CON BOTÓN DE REPORTAR */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: '#9D489E', fontSize: 16 }}>
                    PREGUNTA {preg.orden || index + 1}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {preg.es_reportada && <Ionicons name="warning" size={18} color="#FF9500" />}
                    <TouchableOpacity
                      onPress={() => {
                        setReportQuestionData({
                          id: preg.id_intento_pregunta || preg.id_pregunta,
                          orden: preg.orden || index + 1
                        });
                        setReportModalVisible(true);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Ionicons name="alert-circle-outline" size={18} color="#FF3B30" />
                      <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>REPORTAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[globalStyles.questionText, { fontSize: 18, lineHeight: 24, marginBottom: 20 }]}>
                  {preg.enunciado}
                </Text>

                {preg.alternativas && preg.alternativas.map((opcion: any) => {
                  let bgColor = '#F0F2F3';
                  let txtColor = '#5F7282';
                  let separatorColor = '#D1D5D8';

                  if (opcion.es_correcta === true) {
                    bgColor = '#00C9A7';
                    txtColor = '#FFF';
                    separatorColor = 'rgba(255,255,255,0.3)';
                  }
                  else if (opcion.es_elegida === true && opcion.es_correcta === false) {
                    bgColor = '#FF3B30';
                    txtColor = '#FFF';
                    separatorColor = 'rgba(255,255,255,0.3)';
                  }

                  return (
                    <View
                      key={opcion.id_alternativa_intento}
                      style={[globalStyles.optionCard, { backgroundColor: bgColor, marginBottom: 10 }]}
                    >
                      <View style={globalStyles.literalContainer}>
                        <Text style={[globalStyles.optionText, { color: txtColor, fontWeight: 'bold' }]}>
                          {opcion.identificador_letra ? opcion.identificador_letra.toUpperCase() : '-'}
                        </Text>
                      </View>

                      <View style={[globalStyles.verticalSeparator, { backgroundColor: separatorColor }]} />

                      <View style={globalStyles.contentContainer}>
                        <Text style={[globalStyles.optionText, { color: txtColor }]}>
                          {opcion.contenido}
                        </Text>
                      </View>
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

        {/* MODAL DE REPORTE (DENTRO DE IS_REVIEW_MODE) */}
        <Modal visible={reportModalVisible} transparent animationType="fade">
          <View style={[globalStyles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={{ width: '90%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' }}>

              <View style={{ backgroundColor: '#6B3E75', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="alert-circle-outline" size={26} color="#FFF" />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ color: '#E0C8E0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
                          PREGUNTA #{reportQuestionData.orden}
                        </Text>
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>REPORTAR PREGUNTA</Text>
                    </View>
                 </View>
                 <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                    <Ionicons name="close" size={26} color="#FFF" />
                 </TouchableOpacity>
              </View>

              <View style={{ padding: 20 }}>
                 <Text style={{ color: '#5F7282', marginBottom: 20, lineHeight: 20 }}>
                   Describe el problema que encontraste con esta pregunta. Tu feedback nos ayuda a mejorar.
                 </Text>
                 <Text style={{ color: '#5F7282', fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 }}>
                   RAZÓN DEL REPORTE
                 </Text>
                 <TextInput
                    style={{
                      borderWidth: 1, borderColor: '#D1D5D8', borderRadius: 8, padding: 15,
                      height: 120, textAlignVertical: 'top', color: '#5F7282', backgroundColor: '#FAFAFA'
                    }}
                    placeholder="Ej: Esta mal en algo, la respuesta correcta debería ser..."
                    placeholderTextColor="#A0AAB2"
                    multiline
                    maxLength={500}
                    value={reportReason}
                    onChangeText={setReportReason}
                 />
                 <Text style={{ textAlign: 'right', color: '#A0AAB2', fontSize: 11, marginTop: 5 }}>
                   {reportReason.length}/500
                 </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 20, borderTopWidth: 1, borderColor: '#EEE' }}>
                 <TouchableOpacity
                   style={{ paddingVertical: 12, paddingHorizontal: 20, flex: 1, alignItems: 'center' }}
                   onPress={() => setReportModalVisible(false)}
                   disabled={isReporting}
                 >
                    <Text style={{ color: '#9D489E', fontWeight: 'bold' }}>CANCELAR</Text>
                 </TouchableOpacity>

                 <TouchableOpacity
                    style={{
                      backgroundColor: '#9D489E', paddingVertical: 12, paddingHorizontal: 20,
                      borderRadius: 8, flex: 1, alignItems: 'center'
                    }}
                    onPress={handleSubmitReport}
                    disabled={isReporting}
                 >
                    {isReporting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENVIAR REPORTE</Text>
                    )}
                 </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

        <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <BottomNavbar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader
        onOpenMenu={() => setMenuVisible(true)}
      />

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
              {selectedDetail?.preguntas?.map((preg: any, index: number) => (
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
              <Text style={globalStyles.primaryButtonText}>VER TRAINING COMPLETO</Text>
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