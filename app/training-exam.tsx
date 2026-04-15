import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, Modal, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { CustomDrawer } from '../components/CustomDrawer';

export default function TrainingExam() {
  const router = useRouter();
  const { trainingId, totalLimit } = useLocalSearchParams();

  const [preguntas, setPreguntas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPreguntas, setTotalPreguntas] = useState(parseInt(totalLimit || '0'));
  const [hasNextPage, setHasNextPage] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finalStorage, setFinalStorage] = useState({ t: 0, c: 0 });

  const [menuVisible, setMenuVisible] = useState(false);

  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);

  const fetchPreguntas = async (page) => {
    setIsLoading(true);
    setFeedback(null);
    setRespuestas({});
    try {
      const response = await apiClient(`/evaluaciones/training/${trainingId}/pregunta/${page}/`);
      const data = await response.json();
      if ((response.ok || data.status === 'success') && data.data) {
        setPreguntas([data.data]);
        const totalApi = data.data.total_preguntas || data.total_preguntas;
        if (totalApi) setTotalPreguntas(totalApi);
        setHasNextPage(page < (totalApi || totalPreguntas));
      }
    } catch (error) { console.error('Error fetching:', error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (trainingId && !isReviewMode) fetchPreguntas(currentPage); }, [trainingId, currentPage, isReviewMode]);

  useEffect(() => {
    const i = setInterval(() => setSegundosTranscurridos(s => s + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const handleSelectOption = async (preguntaId, opcionId) => {
    if (feedback || isAnswering) return;
    setIsAnswering(true);
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcionId }));

    try {
      const response = await apiClient(`/evaluaciones/training/${trainingId}/pregunta/${currentPage}/`, {
        method: 'POST',
        body: JSON.stringify({ id_alternativa_intento: opcionId })
      });
      const data = await response.json();

      if (response.ok || data.status === 'success') {
        const resData = data.data;
        const sTotal = await AsyncStorage.getItem('TOTALPREGS');
        await AsyncStorage.setItem('TOTALPREGS', (parseInt(sTotal || '0') + 1).toString());

        if (resData.es_correcta) {
          const sCorr = await AsyncStorage.getItem('TOTALPREGSCORRECTAS');
          await AsyncStorage.setItem('TOTALPREGSCORRECTAS', (parseInt(sCorr || '0') + 1).toString());
        }

        const altCorr = resData.alternativas?.find(a => a.es_correcta === true);
        setFeedback({
          esCorrecta: resData.es_correcta,
          correctaId: altCorr?.id_alternativa_intento,
          explicacion: resData.feedback?.justificacion || 'Sin explicación.'
        });

        if (resData.total_preguntas) {
          setTotalPreguntas(resData.total_preguntas);
          setHasNextPage(currentPage < resData.total_preguntas);
        }
      }
    } catch (error) { Alert.alert('Error', 'Fallo de conexión.'); }
    finally { setIsAnswering(false); }
  };

  const handleTerminar = async () => {
    setIsSubmitting(true);
    try {
      await apiClient('/evaluaciones/training/terminar/', {
        method: 'POST',
        body: JSON.stringify({ id_intento: trainingId })
      });
      const t = await AsyncStorage.getItem('TOTALPREGS');
      const c = await AsyncStorage.getItem('TOTALPREGSCORRECTAS');
      setFinalStorage({ t: t || 0, c: c || 0 });
      setShowResults(true);
    } catch (error) { Alert.alert('Error', 'Error al finalizar.'); }
    finally { setIsSubmitting(false); }
  };

  const handleVerResultados = async () => {
    setShowResults(false);
    setLoadingReview(true);
    try {
      const response = await apiClient(`/evaluaciones/training/historial/${trainingId}/`);
      const data = await response.json();
      const detail = data.data || data;

      if (detail && detail.preguntas) {
        setReviewData(detail.preguntas);
        setIsReviewMode(true);
      } else {
        Alert.alert('Aviso', 'No se pudieron cargar los detalles del examen.');
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error cargando revisión:", error);
      Alert.alert('Error', 'Fallo al obtener los resultados detallados.');
      setShowResults(true);
    } finally {
      setLoadingReview(false);
    }
  };

  const formatearTiempo = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loadingReview) return (
    <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#9D489E" />
      <Text style={{ marginTop: 15, color: '#5F7282', fontWeight: 'bold' }}>PREPARANDO RESULTADOS...</Text>
    </View>
  );

  if (isReviewMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={35} color="#9D489E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/dashboard')}>
             <Ionicons name="person-circle-outline" size={40} color="#9D489E" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ padding: 25 }}>
            <Text style={[globalStyles.headerText, { textAlign: 'left', marginBottom: 20, fontSize: 22 }]}>
              REVISIÓN DEL EXAMEN
            </Text>

            {reviewData.map((preg, index) => (
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
                    {preg.es_correcta ? '¡RESPONDIÓ CORRECTAMENTE!' : 'RESPONDIÓ INCORRECTAMENTE'}
                  </Text>
                  <Text style={{ color: '#5F7282', lineHeight: 20 }}>
                    {preg.justificacion || preg.feedback?.justificacion || 'Sin explicación detallada.'}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[globalStyles.primaryButton, { marginTop: 20 }]}
              onPress={() => router.replace('/training-setup')}
            >
              <Text style={globalStyles.primaryButtonText}>VOLVER AL INICIO</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <BottomNavbar />
      </SafeAreaView>
    );
  }

  if (isLoading) return (
    <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#9D489E" />
      <Text style={{ marginTop: 15, color: '#5F7282', fontWeight: 'bold' }}>CARGANDO...</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={35} color="#9D489E" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/dashboard')}>
           <Ionicons name="person-circle-outline" size={40} color="#9D489E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 25 }}>
          <Text style={[globalStyles.timerText, { marginBottom: 20, color: '#5F7282', fontWeight: 'bold' }]}>
            TIEMPO: {formatearTiempo(segundosTranscurridos)}
          </Text>

          {preguntas.map((item, index) => {
            const p = item.pregunta;
            return (
              <View key={p.id_pregunta || index}>
                <Text style={{ fontWeight: 'bold', color: '#9D489E', fontSize: 16, marginBottom: 10 }}>
                  PREGUNTA {currentPage} DE {totalPreguntas}
                </Text>
                <Text style={[globalStyles.questionText, { fontSize: 18, lineHeight: 24, marginBottom: 25 }]}>{p.enunciado}</Text>

                {p.alternativas.map((opcion) => {
                  const oId = opcion.id_alternativa_intento;
                  const isSelected = respuestas[p.id_pregunta] === oId;
                  let bgColor = '#F0F2F3';
                  let txtColor = '#5F7282';

                  if (feedback) {
                    if (isSelected) {
                      bgColor = feedback.esCorrecta ? '#00C9A7' : '#FF3B30';
                      txtColor = '#FFF';
                    } else if (String(oId) === String(feedback.correctaId)) {
                      bgColor = '#00C9A7';
                      txtColor = '#FFF';
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={oId}
                      style={[globalStyles.optionButton, { backgroundColor: bgColor, marginBottom: 12, padding: 18, borderRadius: 12 }]}
                      onPress={() => handleSelectOption(p.id_pregunta, oId)}
                      disabled={!!feedback || isAnswering}
                    >
                      <Text style={{ color: txtColor, fontWeight: '600' }}>
                        {opcion.identificador_letra.toUpperCase()}) {opcion.contenido}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {feedback && (
                  <View style={{ marginTop: 25, padding: 20, backgroundColor: '#F8F9FA', borderRadius: 15, borderWidth: 2, borderColor: feedback.esCorrecta ? '#00C9A7' : '#FF3B30' }}>
                    <Text style={{ fontWeight: 'bold', color: feedback.esCorrecta ? '#00C9A7' : '#FF3B30', marginBottom: 8, fontSize: 16 }}>
                      {feedback.esCorrecta ? '¡CORRECTO!' : 'RESPUESTA INCORRECTA'}
                    </Text>
                    <Text style={{ color: '#5F7282', lineHeight: 20 }}>{feedback.explicacion}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {feedback && (
            <View style={{ marginTop: 30 }}>
              {hasNextPage ? (
                <TouchableOpacity style={globalStyles.primaryButton} onPress={() => setCurrentPage(prev => prev + 1)}>
                  <Text style={globalStyles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>
                    SIGUIENTE PREGUNTA
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#9D489E' }]} onPress={handleTerminar} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={globalStyles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>
                      FINALIZAR ENTRENAMIENTO
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showResults} transparent animationType="fade">
        <View style={globalStyles.modalOverlay}>
          <View style={[globalStyles.modalContent, { paddingHorizontal: 20, paddingBottom: 30 }]}>

            <Image
              source={require('../assets/images/Recurso 11.png')}
              style={{ width: 110, height: 110, resizeMode: 'contain', marginBottom: 15 }}
            />

            <Text style={{ color: '#8A97A0', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 }}>
              EXAMEN TRAINING
            </Text>

            <Text style={[globalStyles.modalTitle, { fontSize: 24, marginTop: 2, marginBottom: 15, color: '#5F7282' }]}>
              ¡TERMINADO!
            </Text>

            <Text style={{ color: '#8A97A0', fontSize: 14, marginBottom: 30, textAlign: 'center' }}>
              Tienes un resultado de: <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#5F7282' }}>{finalStorage.c}/{finalStorage.t}</Text>
            </Text>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '85%', marginBottom: 15, marginTop: 0, minHeight: 45, borderRadius: 8 }]}
              onPress={handleVerResultados}
            >
              <Text style={[globalStyles.primaryButtonText, { fontSize: 14, fontWeight: '600' }]}>VER RESULTADOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '85%', marginTop: 0, minHeight: 45, borderRadius: 8 }]}
              onPress={() => { setShowResults(false); router.replace('/training-setup'); }}
            >
              <Text style={[globalStyles.primaryButtonText, { fontSize: 14, fontWeight: '600' }]}>CONTINUAR</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}