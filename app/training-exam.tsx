import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';
import { CustomDrawer } from '../components/CustomDrawer';
import { MainHeader } from "@/components/MainHeader";

export default function TrainingExam() {
  const router = useRouter();
  const { trainingId, totalLimit, startPage } = useLocalSearchParams();

  const [preguntas, setPreguntas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(parseInt(startPage || '1'));
  const [totalPreguntas, setTotalPreguntas] = useState(parseInt(totalLimit || '0'));
  const [hasNextPage, setHasNextPage] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [finalStorage, setFinalStorage] = useState({ t: 0, c: 0 });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);

  const [showGifModal, setShowGifModal] = useState(false);
  const [isCorrectResponse, setIsCorrectResponse] = useState(true);

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

        setIsCorrectResponse(resData.es_correcta);
        setShowGifModal(true);
        setTimeout(() => setShowGifModal(false), 2000);

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
      }
    } catch (error) { Alert.alert('Error', 'Fallo al obtener resultados.'); }
    finally { setLoadingReview(false); }
  };

  const formatearTiempo = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (isReviewMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <MainHeader onOpenMenu={() => setMenuVisible(true)} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ padding: 25 }}>
            <Text style={[globalStyles.headerText, { textAlign: 'left', marginBottom: 20, fontSize: 22 }]}>REVISIÓN</Text>
            {reviewData.map((preg, index) => (
              <View key={preg.id_pregunta || index} style={{ marginBottom: 35 }}>
                <Text style={{ fontWeight: 'bold', color: '#9D489E', marginBottom: 10 }}>PREGUNTA {index + 1}</Text>
                <Text style={globalStyles.questionText}>{preg.enunciado}</Text>

                {preg.alternativas.map((opcion) => {
                  let bgColor = '#F0F2F3';
                  let txtColor = '#5F7282';
                  let separatorColor = '#D1D5D8';

                  if (opcion.es_correcta === true) {
                    bgColor = '#00C9A7';
                    txtColor = '#FFF';
                    separatorColor = 'rgba(255,255,255,0.3)';
                  }
                  else if (opcion.es_elegida === true) {
                    bgColor = '#FF3B30';
                    txtColor = '#FFF';
                    separatorColor = 'rgba(255,255,255,0.3)';
                  }
                  return (
                    <View key={opcion.id_alternativa_intento} style={[globalStyles.optionCard, { backgroundColor: bgColor, marginBottom: 10 }]}>
                      <View style={globalStyles.literalContainer}>
                        <Text style={[globalStyles.optionText, { color: txtColor, fontWeight: 'bold' }]}>
                          {opcion.identificador_letra?.toUpperCase() || '-'}
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

                <View style={{ marginTop: 15, padding: 15, backgroundColor: '#F8F9FA', borderRadius: 10, borderLeftWidth: 4, borderLeftColor: preg.es_correcta ? '#00C9A7' : '#FF3B30' }}>
                  <Text style={{ fontSize: 12, color: '#5F7282', lineHeight: 18 }}>
                    {preg.justificacion || preg.feedback?.justificacion || 'Sin explicación disponible.'}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.replace('/training-setup')}>
              <Text style={globalStyles.primaryButtonText}>VOLVER AL INICIO</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNavbar />
      </SafeAreaView>
    );
  }

  if (isLoading || loadingReview) return (
    <View style={[globalStyles.container, { alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#9D489E" />
      <Text style={{ marginTop: 15, color: '#5F7282' }}>CARGANDO...</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={35} color="#9D489E" /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/dashboard')}><Ionicons name="person-circle-outline" size={40} color="#9D489E" /></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 25 }}>
          <Text style={globalStyles.timerText}>TIEMPO: {formatearTiempo(segundosTranscurridos)}</Text>

          {preguntas.map((item, index) => {
            const p = item.pregunta;
            return (
              <View key={p.id_pregunta || index}>
                <Text style={{ fontWeight: 'bold', color: '#9D489E', marginBottom: 10 }}>PREGUNTA {currentPage} DE {totalPreguntas}</Text>
                <Text style={globalStyles.questionText}>{p.enunciado}</Text>

                {p.alternativas.map((opcion) => {
                  const oId = opcion.id_alternativa_intento;
                  const isSelected = respuestas[p.id_pregunta] === oId;
                  let bgColor = '#F0F2F3';
                  let txtColor = '#5F7282';
                  let separatorColor = '#D1D5D8';

                  if (feedback) {
                    if (isSelected) {
                      bgColor = feedback.esCorrecta ? '#00C9A7' : '#FF3B30';
                      txtColor = '#FFF';
                      separatorColor = 'rgba(255,255,255,0.3)';
                    } else if (String(oId) === String(feedback.correctaId)) {
                      bgColor = '#00C9A7';
                      txtColor = '#FFF';
                      separatorColor = 'rgba(255,255,255,0.3)';
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={oId}
                      style={[globalStyles.optionCard, { backgroundColor: bgColor }]}
                      onPress={() => handleSelectOption(p.id_pregunta, oId)}
                      disabled={!!feedback || isAnswering}
                    >
                      <View style={globalStyles.literalContainer}>
                        <Text style={[globalStyles.optionText, { color: txtColor }]}>
                          {opcion.identificador_letra.toUpperCase()}
                        </Text>
                      </View>

                      <View style={[globalStyles.verticalSeparator, { backgroundColor: separatorColor }]} />

                      <View style={globalStyles.contentContainer}>
                        <Text style={[globalStyles.optionText, { color: txtColor }]}>
                          {opcion.contenido}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {feedback && (
                  <View style={{ marginTop: 25, padding: 20, backgroundColor: '#F8F9FA', borderRadius: 15, borderWidth: 2, borderColor: feedback.esCorrecta ? '#00C9A7' : '#FF3B30' }}>
                    <Text style={{ fontWeight: 'bold', color: feedback.esCorrecta ? '#00C9A7' : '#FF3B30', marginBottom: 8 }}>
                      {feedback.esCorrecta ? '¡CORRECTO!' : 'RESPUESTA INCORRECTA'}
                    </Text>
                    <Text style={{ color: '#5F7282' }}>{feedback.explicacion}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {feedback && (
            <View style={{ marginTop: 30 }}>
              {hasNextPage ? (
                <TouchableOpacity style={globalStyles.primaryButton} onPress={() => setCurrentPage(prev => prev + 1)}>
                  <Text style={globalStyles.primaryButtonText}>SIGUIENTE PREGUNTA</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={globalStyles.primaryButton} onPress={handleTerminar} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>FINALIZAR</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showGifModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGifModal(false)}
      >
        <View style={globalStyles.gifModalOverlay}>
          <View style={globalStyles.gifContainer}>
            <Image
              source={isCorrectResponse
                ? require('../assets/images/Correcto.gif')
                : require('../assets/images/Incorrecto.gif')}
              style={globalStyles.gifImageGrande}
              resizeMode="contain"
            />
            <Text style={[
              globalStyles.gifFeedbackTextFlotante,
              { color: isCorrectResponse ? '#00C9A7' : '#FF3B30' }
            ]}>
              {isCorrectResponse ? '¡CORRECTO!' : '¡INCORRECTO!'}
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showResults} transparent animationType="fade">
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Image source={require('../assets/images/Recurso 11.png')} style={{ width: 100, height: 100, marginBottom: 15 }} />
            <Text style={globalStyles.modalTitle}>¡TERMINADO!</Text>
            <Text style={globalStyles.modalResult}>Resultado: <Text style={globalStyles.resultBold}>{finalStorage.c}/{finalStorage.t}</Text></Text>
            <TouchableOpacity style={[globalStyles.primaryButton, { width: '100%' }]} onPress={handleVerResultados}>
              <Text style={globalStyles.primaryButtonText}>VER RESULTADOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.primaryButton, { width: '100%', backgroundColor: '#CCC' }]} onPress={() => router.replace('/training-setup')}>
              <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}