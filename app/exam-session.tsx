import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { MainHeader } from "@/components/MainHeader";
import { CustomDrawer } from '../components/CustomDrawer';

export default function ExamSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id_intento = params.id_intento;

  const duracion_minutos = parseInt(params.duracion_minutos as string) || 60;
  const total_preguntas = parseInt(params.total_preguntas as string) || 0;
  const cuestionarioInicial = params.cuestionario_str ? JSON.parse(params.cuestionario_str as string) : [];

  const [preguntaActualData, setPreguntaActualData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cuestionario, setCuestionario] = useState<any[]>(cuestionarioInicial);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null);

  const [segundosRestantes, setSegundosRestantes] = useState(duracion_minutos * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showGridModal, setShowGridModal] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isCurrentQuestionReported, setIsCurrentQuestionReported] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTerminarExamen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (id_intento) fetchPregunta(currentPage);
  }, [id_intento, currentPage]);

  const checkReportStatus = async (idIntentoPregunta: number) => {
    try {
      const response = await apiClient(`/evaluaciones/reportes/?id_intento_pregunta=${idIntentoPregunta}`);
      const data = await response.json();
      if (response.ok || data.status === 'success') {
        setIsCurrentQuestionReported(data.data?.es_reportada || false);
      }
    } catch (error) {
      console.error("Error comprobando el reporte:", error);
    }
  };

  const fetchPregunta = async (orden: number) => {
    setIsLoading(true);
    setIsCurrentQuestionReported(false); // Reseteamos al cambiar de pregunta

    try {
      const response = await apiClient(`/evaluaciones/examen/${id_intento}/pregunta/${orden}/`);
      const data = await response.json();

      if ((response.ok || data.status === 'success') && data.data) {
        setPreguntaActualData(data.data.pregunta || data.data);
        if (data.data.cuestionario) {
          setCuestionario(data.data.cuestionario);

          const idActual = data.data.cuestionario.find((q: any) => q.orden === orden)?.id_intento_pregunta;
          if (idActual) {
            checkReportStatus(idActual);
          }
        }

        const altElegida = data.data.pregunta?.alternativas?.find((a: any) => a.es_elegida);
        if (altElegida) {
          setRespuestaSeleccionada(altElegida.id_alternativa_intento);
        } else {
          setRespuestaSeleccionada(null);
        }
      } else {
        Alert.alert(
          'Aviso',
          data.error || data.message || 'No se puede continuar con este examen.',
          [{ text: "Aceptar", onPress: () => {
                router.replace('/dashboard');
                router.push('/exam-list');
              }}]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Fallo de conexión al cargar la pregunta.',
        [{ text: "Aceptar", onPress: () => {
                router.replace('/dashboard');
                router.push('/exam-list');
              }}]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = async (opcionId: number) => {
    if (isAnswering) return;
    setIsAnswering(true);
    setRespuestaSeleccionada(opcionId);

    try {
      const response = await apiClient(`/evaluaciones/examen/${id_intento}/pregunta/${currentPage}/`, {
        method: 'POST',
        body: JSON.stringify({ id_alternativa_intento: opcionId })
      });
      const data = await response.json();

      if (response.ok || data.status === 'success') {
        if (data.data && data.data.cuestionario) {
          setCuestionario(data.data.cuestionario);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Fallo de conexión al guardar respuesta.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSubmitReport = async (idIntentoPregunta: number) => {
    if (!reportReason.trim()) {
      Alert.alert("Atención", "Por favor ingresa una razón para el reporte.");
      return;
    }

    if (!idIntentoPregunta) {
      Alert.alert("Error", "No se pudo identificar la pregunta actual.");
      return;
    }

    setIsReporting(true);
    try {
      const response = await apiClient('/evaluaciones/reportes/', {
        method: 'POST',
        body: JSON.stringify({
          id_intento_pregunta: idIntentoPregunta,
          razon: reportReason.trim()
        })
      });

      const data = await response.json();

      if (response.ok || data.status === 'success') {
        Alert.alert("Éxito", "El reporte ha sido enviado. ¡Gracias por tu feedback!");
        setReportModalVisible(false);
        setReportReason('');
        setIsCurrentQuestionReported(true); // Cambiamos el estado para que se marque en gris
      } else {
        Alert.alert("Error", data.message || "No se pudo enviar el reporte.");
      }
    } catch (error) {
      Alert.alert("Error", "Fallo de conexión al enviar el reporte.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleQuitarSeleccion = () => {
    setRespuestaSeleccionada(null);
  };

  const toggleMarcarPregunta = async () => {
    const estaMarcadaActual = cuestionario.find(q => q.orden === currentPage)?.es_marcada || false;
    const nuevaMarca = !estaMarcadaActual;

    try {
      const response = await apiClient(`/evaluaciones/examen/${id_intento}/pregunta/${currentPage}/`, {
        method: 'PUT',
        body: JSON.stringify({ es_marcada: nuevaMarca })
      });
      const data = await response.json();

      if (response.ok || data.status === 'success') {
         setCuestionario(data.data.cuestionario);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la marca de la pregunta.');
    }
  };

  const handleTerminarExamen = async (porTiempoAgotado = false) => {
    setIsSubmitting(true);
    try {
      await apiClient('/evaluaciones/examen/terminar/', {
        method: 'POST',
        body: JSON.stringify({ id_intento: parseInt(id_intento as string) })
      });
      setShowGridModal(false);
      setShowFinishedModal(true);
    } catch (error) {
      Alert.alert('Error', 'Fallo al finalizar el examen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatearTiempo = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const porcentajeTiempo = Math.max(0, (segundosRestantes / (duracion_minutos * 60)) * 100);

  const estaMarcadaActual = cuestionario.find(q => q.orden === currentPage)?.es_marcada || false;

  const renderGridItem = (item: any) => {
    const isAnswered = item.es_elegida;
    const isMarked = item.es_marcada;

    let borderColor = '#9D489E';
    let bgColor = 'transparent';
    let textColor = '#9D489E';

    if (isMarked) {
      bgColor = '#4EAB9D';
      borderColor = '#4EAB9D';
      textColor = '#FFF';
    } else if (isAnswered) {
      bgColor = '#9D489E';
      borderColor = '#9D489E';
      textColor = '#FFF';
    }

    return (
      <TouchableOpacity
        key={item.id_intento_pregunta || item.orden}
        style={[globalStyles.gridItem, { borderColor, backgroundColor: bgColor }]}
        onPress={() => {
          setCurrentPage(item.orden);
          setShowGridModal(false);
        }}
      >
        <Text style={[globalStyles.gridItemText, { color: textColor }]}>{item.orden}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && !preguntaActualData) {
    return (
      <View style={[globalStyles.container, { alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9D489E" />
        <Text style={{ marginTop: 15, color: '#5F7282' }}>CARGANDO PREGUNTA...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>

      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 25, paddingBottom: 100 }}>

        <View style={globalStyles.examTimerContainer}>
          <Text style={globalStyles.examTimerText}>TIEMPO RESTANTE: {formatearTiempo(segundosRestantes)}</Text>
          <View style={globalStyles.progressBarBackground}>
            <View style={[globalStyles.progressBarFill, { width: `${porcentajeTiempo}%` }]} />
          </View>
        </View>

        {preguntaActualData && (
          <View style={{ marginTop: 20 }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontWeight: 'bold', color: '#5F7282', fontSize: 16 }}>
                PREGUNTA {currentPage}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <TouchableOpacity
                  onPress={() => setReportModalVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Ionicons
                    name={isCurrentQuestionReported ? "checkmark-circle" : "alert-circle-outline"}
                    size={18}
                    color={isCurrentQuestionReported ? "#A0AAB2" : "#FF3B30"}
                  />
                  <Text style={{
                    color: isCurrentQuestionReported ? "#A0AAB2" : "#FF3B30",
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginLeft: 4
                  }}>
                    {isCurrentQuestionReported ? "REPORTADO" : "REPORTAR"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowGridModal(true)} style={{ padding: 5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F0F9', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 10, color: '#9D489E', marginRight: 5, fontWeight: 'bold' }}>VER TODAS</Text>
                  <Ionicons name="grid" size={20} color="#9D489E" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[globalStyles.questionText, { color: '#5F7282' }]}>
              {preguntaActualData.enunciado}
            </Text>

            {preguntaActualData.alternativas?.map((opcion: any) => {
              const isSelected = respuestaSeleccionada === opcion.id_alternativa_intento;

              const bgColor = isSelected ? '#00C9A7' : '#F0F2F3';
              const borderColor = isSelected ? '#00C9A7' : 'transparent';
              const txtColor = isSelected ? '#FFF' : '#5F7282';
              const separatorColor = isSelected ? 'rgba(255,255,255,0.3)' : '#D1D5D8';

              return (
                <TouchableOpacity
                  key={opcion.id_alternativa_intento}
                  style={[globalStyles.optionCard, { backgroundColor: bgColor, borderWidth: 1, borderColor }]}
                  onPress={() => handleSelectOption(opcion.id_alternativa_intento)}
                  disabled={isAnswering}
                >
                  <View style={globalStyles.literalContainer}>
                     <Text style={[globalStyles.optionText, { fontWeight: 'bold', color: txtColor }]}>
                        {opcion.identificador_letra ? opcion.identificador_letra.toUpperCase() : '-'}
                     </Text>
                  </View>
                  <View style={[globalStyles.verticalSeparator, { backgroundColor: separatorColor }]} />
                  <View style={globalStyles.contentContainer}>
                    <Text style={[globalStyles.optionText, { fontWeight: isSelected ? 'bold' : 'normal', color: txtColor }]}>
                      {opcion.contenido}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={globalStyles.bottomActionsRow}>
              <TouchableOpacity onPress={handleQuitarSeleccion}>
                <Text style={globalStyles.actionTextButton}>QUITAR SELECCIÓN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={globalStyles.actionMarkButton} onPress={toggleMarcarPregunta}>
                <Text style={[globalStyles.actionMarkText, { color: estaMarcadaActual ? '#4EAB9D' : '#5F7282' }]}>
                  {estaMarcadaActual ? 'PREGUNTA MARCADA' : 'MARCAR PREGUNTA'}
                </Text>
                <Ionicons
                  name={estaMarcadaActual ? "flag" : "flag-outline"}
                  size={16}
                  color={estaMarcadaActual ? "#4EAB9D" : "#5F7282"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' }}>
        <TouchableOpacity disabled={currentPage === 1 || isLoading} onPress={() => setCurrentPage(p => Math.max(1, p - 1))}>
          <Text style={[globalStyles.actionTextButton, { color: currentPage === 1 || isLoading ? '#CCC' : '#9D489E', fontSize: 14 }]}>ANTERIOR</Text>
        </TouchableOpacity>

        {currentPage === total_preguntas ? (
          <TouchableOpacity disabled={isLoading} onPress={() => handleTerminarExamen(false)}>
            <Text style={[globalStyles.actionTextButton, { color: isLoading ? '#CCC' : '#FF3B30', fontSize: 14 }]}>FINALIZAR EXAMEN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity disabled={isLoading} onPress={() => setCurrentPage(p => Math.min(total_preguntas, p + 1))}>
            <Text style={[globalStyles.actionTextButton, { color: isLoading ? '#CCC' : '#9D489E', fontSize: 14 }]}>SIGUIENTE</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showGridModal} transparent animationType="fade">
        <View style={[globalStyles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={globalStyles.examGridModalContent}>
            <Text style={{color: '#9D489E', fontSize: 14, fontWeight: 'bold'}}>EXAMEN</Text>
            <Text style={globalStyles.examGridTitle}>ONLINE</Text>
            <Text style={globalStyles.examGridSubTitle}>
              {preguntaActualData?.especialidad?.nombre
                ? `${preguntaActualData.especialidad.nombre.toUpperCase()} - ${preguntaActualData.tema?.nombre?.toUpperCase() || ''}`
                : 'ESPECIALIDAD - TEMA'}
            </Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={globalStyles.gridContainer}>
                {cuestionario.map(renderGridItem)}
              </View>
            </ScrollView>

            <View style={[globalStyles.examTimerContainer, { marginTop: 20 }]}>
              <Text style={globalStyles.examTimerText}>TIEMPO RESTANTE: {formatearTiempo(segundosRestantes)}</Text>
              <View style={globalStyles.progressBarBackground}>
                <View style={[globalStyles.progressBarFill, { width: `${porcentajeTiempo}%` }]} />
              </View>
            </View>

            <Text style={{ textAlign: 'center', color: '#5F7282', fontSize: 12, marginTop: 10, fontWeight: 'bold' }}>
              {cuestionario.filter(q => q.es_elegida).length} DE {total_preguntas} PREGUNTAS EN TOTAL
            </Text>

            <TouchableOpacity style={[globalStyles.primaryButton, { marginTop: 20, marginHorizontal: 0 }]} onPress={() => setShowGridModal(false)}>
              <Text style={globalStyles.primaryButtonText}>VOLVER AL EXAMEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFinishedModal} transparent animationType="fade">
        <View style={globalStyles.modalOverlay}>
          <View style={[globalStyles.modalContent, { paddingVertical: 40 }]}>
            <Ionicons name="browsers-outline" size={60} color="#5F7282" style={{ marginBottom: 10 }} />
            <Text style={{color: '#9D489E', fontSize: 14, fontWeight: 'bold'}}>EXAMEN ONLINE</Text>
            <Text style={[globalStyles.modalTitle, { fontSize: 26, marginBottom: 30 }]}>¡TERMINADO!</Text>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%', marginHorizontal: 0, backgroundColor: '#A0AAB2' }]}
              onPress={() => {
                router.replace('/dashboard');
                router.push('/exam-list');
                router.push('/exam-history');
              }}
            >
              <Text style={globalStyles.primaryButtonText}>VER RESULTADOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%', marginHorizontal: 0, marginTop: 15 }]}
              onPress={() => router.replace('/dashboard')}
            >
              <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <Modal visible={reportModalVisible} transparent animationType="fade">
        <View style={[globalStyles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={{ width: '90%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#6B3E75', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="alert-circle-outline" size={26} color="#FFF" />
                  <View style={{ marginLeft: 10 }}>
                      <Text style={{ color: '#E0C8E0', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>PREGUNTA #{currentPage}</Text>
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
                    borderWidth: 1,
                    borderColor: '#D1D5D8',
                    borderRadius: 8,
                    padding: 15,
                    height: 120,
                    textAlignVertical: 'top',
                    color: '#5F7282',
                    backgroundColor: '#FAFAFA'
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
                  <Text style={{ color: '#A678A6', fontWeight: 'bold' }}>CANCELAR</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  style={{
                    backgroundColor: '#9D489E',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    flex: 1,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    const idActual = cuestionario?.find(q => q.orden === currentPage)?.id_intento_pregunta;
                    handleSubmitReport(idActual);
                  }}
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
    </SafeAreaView>
  );
}