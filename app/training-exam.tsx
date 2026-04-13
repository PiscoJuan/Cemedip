import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";

export default function TrainingExam() {
  const router = useRouter();
  const { trainingId } = useLocalSearchParams();

  const [preguntas, setPreguntas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false); // Nuevo estado para la carga al responder
  const [respuestas, setRespuestas] = useState({});
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

  // Nuevo estado para guardar la retroalimentación de la pregunta actual
  const [feedback, setFeedback] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchPreguntas = async (page) => {
    setIsLoading(true);
    setFeedback(null); // Limpiamos el feedback al cambiar de página
    setRespuestas({}); // Limpiamos la selección

    try {
      const response = await apiClient(`/evaluaciones/training/${trainingId}/pregunta/${page}/`, {
        method: 'GET',
      });

      const data = await response.json();
      console.log('=== RESPUESTA POST (AL RESPONDER) 1===', JSON.stringify(data, null, 2));
      if (response.ok || data.status === 'success' || data.statusCode === 200) {
        setPreguntas(data.data ? [data.data] : []);
        setHasNextPage(true);
      } else if (data.statusCode === 404) {
        setPreguntas([]);
        setHasNextPage(false);
      } else {
        Alert.alert('Error', data.message || 'No se pudieron cargar las preguntas.');
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      Alert.alert('Error', 'Fallo de conexión al cargar el examen.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trainingId) {
      fetchPreguntas(currentPage);
    } else {
      Alert.alert('Error', 'No se proporcionó un ID de examen.');
      setIsLoading(false);
    }
  }, [trainingId, currentPage]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosTranscurridos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const formatearTiempo = (totalSegundos) => {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = async (preguntaId, opcionId) => {
    if (feedback || isAnswering) return;

    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId
    }));
    setIsAnswering(true);

    try {
      const response = await apiClient(`/evaluaciones/training/${trainingId}/pregunta/${currentPage}/`, {
        method: 'POST',
        body: JSON.stringify({
          id_alternativa_intento: opcionId
        })
      });

      const data = await response.json();
      console.log('=== DATA RECIBIDA ===', JSON.stringify(data, null, 2));

      if (response.ok || data.status === 'success' || data.statusCode === 200) {

        const resData = data.data;

        // 1. Buscamos cuál de las alternativas que devolvió el POST es la correcta
        const alternativaCorrecta = resData.alternativas?.find(alt => alt.es_correcta === true);

        setFeedback({
          esCorrecta: resData.es_correcta, // Viene directo en data.data.es_correcta
          correctaId: alternativaCorrecta?.id_alternativa_intento, // Sacamos el ID de la que encontramos
          explicacion: resData.feedback?.justificacion || 'Sin explicación disponible.' // Está dentro de feedback
        });

      } else {
        Alert.alert('Error', data.message || 'No se pudo guardar la respuesta.');
        setRespuestas({});
      }
    } catch (error) {
      console.error('Error al guardar la respuesta:', error);
      Alert.alert('Error', 'Problema de conexión.');
      setRespuestas({});
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSiguientePagina = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleTerminar = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiClient('/evaluaciones/training/terminar/', {
        method: 'POST',
        body: JSON.stringify({
          id_intento: trainingId
        })
      });

      const data = await response.json();
      console.log('=== RESPUESTA POST (AL RESPONDER) 3===', JSON.stringify(data, null, 2));
      if (response.ok || data.status === 'success' || data.statusCode === 200) {
        router.push({
          pathname: '/training-results',
          params: { trainingId: trainingId, tiempoTomado: segundosTranscurridos }
        });
      } else {
        Alert.alert('Error', data.message || data.error || 'No se pudo terminar el examen.');
      }
    } catch (error) {
      console.error('Error al terminar:', error);
      Alert.alert('Error', 'Fallo de conexión al terminar el examen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={{ marginTop: 10 }}>Cargando pregunta...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ padding: 20 }}>
        <Text style={globalStyles.timerText}>
          TIEMPO TRANSCURRIDO: {formatearTiempo(segundosTranscurridos)}
        </Text>

        {preguntas.length === 0 ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontSize: 18, marginBottom: 20, color: '#555' }}>
              Has respondido todas las preguntas.
            </Text>
            <TouchableOpacity
              style={[globalStyles.primaryButton, { width: '100%' }, isSubmitting && { opacity: 0.7 }]}
              onPress={handleTerminar}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>TERMINAR EXAMEN</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          preguntas.map((item, index) => {
            const laPregunta = item.pregunta;
            const pId = laPregunta.id_pregunta;

            return (
              <View key={pId || index} style={{ marginBottom: 30 }}>
                <Text style={{ fontWeight: 'bold', marginTop: 10, color: '#8A2BE2' }}>
                  PREGUNTA {item.orden || currentPage}
                </Text>

                <Text style={globalStyles.questionText}>
                  {laPregunta.enunciado}
                </Text>

                {(laPregunta.alternativas || []).map((opcion) => {
                  const oId = opcion.id_alternativa_intento;
                  const isSelected = respuestas[pId] === oId;
                  if (feedback) {
                    if (isSelected) {
                      backgroundColor = feedback.esCorrecta ? '#00C9A7' : '#FF3B30';
                      textColor = '#FFF';
                    } else if (String(oId) === String(feedback.correctaId)) {
                      backgroundColor = '#00C9A7';
                      textColor = '#FFF';
                    }
                  }

                  // Lógica de colores FINAL
                  let backgroundColor = '#EEE'; // Gris por defecto
                  let textColor = '#333';

                  if (feedback) {
                    if (isSelected) {
                      // 1. La que el usuario tocó (Verde si acertó, Rojo si falló)
                      backgroundColor = feedback.esCorrecta ? '#00C9A7' : '#FF3B30';
                      textColor = '#FFF';
                    } else if (feedback.correctaId && String(oId) === String(feedback.correctaId)) {
                      // 2. La que NO tocó, pero era la correcta (Se muestra en Verde)
                      backgroundColor = '#00C9A7';
                      textColor = '#FFF';
                    }
                  } else if (isSelected) {
                    // 3. Mientras carga la petición
                    backgroundColor = '#CCC';
                  }

                  return (
                    <TouchableOpacity
                      key={oId}
                      style={[
                        globalStyles.optionButton,
                        { backgroundColor: backgroundColor },
                        // Atenuamos las opciones que no son ni la seleccionada ni la correcta
                        (feedback || isAnswering) && { opacity: (!isSelected && String(oId) !== String(feedback?.correctaId)) ? 0.6 : 1 }
                      ]}
                      onPress={() => handleSelectOption(pId, oId)}
                      disabled={!!feedback || isAnswering}
                    >
                      {isAnswering && isSelected ? (
                        <ActivityIndicator color="#333" />
                      ) : (
                        <Text style={{ color: textColor, fontWeight: isSelected || (feedback && String(oId) === String(feedback.correctaId)) ? 'bold' : 'normal' }}>
                          {opcion.identificador_letra}) {opcion.contenido}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Mostrar explicación si ya se respondió (VERSIÓN VIEJA Y BONITA) */}
                {feedback && (
                  <View style={{ marginTop: 20, padding: 15, backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: feedback.esCorrecta ? '#00C9A7' : '#FF3B30' }}>
                    <Text style={{ fontWeight: 'bold', color: feedback.esCorrecta ? '#00C9A7' : '#FF3B30', marginBottom: 5 }}>
                      {feedback.esCorrecta ? '¡RESPUESTA CORRECTA!' : 'RESPUESTA INCORRECTA'}
                    </Text>
                    <Text style={{ fontStyle: 'italic', color: '#555' }}>{feedback.explicacion}</Text>
                  </View>
                )}

              </View>
            );
          })
        )}

        {preguntas.length > 0 && hasNextPage && feedback && (
          <TouchableOpacity
            style={[globalStyles.primaryButton, { marginBottom: 40, backgroundColor: '#8A2BE2' }]}
            onPress={handleSiguientePagina}
          >
            <Text style={globalStyles.primaryButtonText}>SIGUIENTE PREGUNTA</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}