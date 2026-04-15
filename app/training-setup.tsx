import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
  Alert, Modal, FlatList, Pressable, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "@/utils/apiClient";
import { CustomDrawer } from '../components/CustomDrawer';
import { BottomNavbar } from '../components/BottomNavbar';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {MainHeader} from "@/components/MainHeader";

export default function TrainingSetup() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/dashboard');
        return true;
      };

      const backHandlerSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        backHandlerSubscription.remove();
      };
    }, [router])
  );

  const [especialidades, setEspecialidades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [temas, setTemas] = useState([]);

  const [isLoadingEsp, setIsLoadingEsp] = useState(true);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [isLoadingTemas, setIsLoadingTemas] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedEsp, setSelectedEsp] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [selectedTema, setSelectedTema] = useState(null);
  const [selectedPreguntas, setSelectedPreguntas] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [currentSelectionType, setCurrentSelectionType] = useState(null);

  const opcionesPreguntas = [5, 10, 20, 25, 30, 40, 50, 100];

  useEffect(() => { fetchEspecialidades(); }, []);

  const fetchEspecialidades = async () => {
    setIsLoadingEsp(true);
    try {
      const response = await apiClient('/preguntas/especialidades/');
      const data = await response.json();
      setEspecialidades(data.data || data || []);
    } catch (error) { Alert.alert('Error', 'No se cargaron especialidades.'); }
    finally { setIsLoadingEsp(false); }
  };

  const fetchTipos = async (espId) => {
    setIsLoadingTipos(true);
    try {
      const response = await apiClient(`/preguntas/tipos/?especialidades=${espId}`);
      const data = await response.json();
      setTipos(data.data || data || []);
    } catch (error) { Alert.alert('Error', 'No se cargaron tipos.'); }
    finally { setIsLoadingTipos(false); }
  };

  const fetchTemas = async (espId, tipoId) => {
    setIsLoadingTemas(true);
    try {
      const response = await apiClient(`/preguntas/temas/?especialidades=${espId}&tipos=${tipoId}`);
      const data = await response.json();
      setTemas(data.data || data || []);
    } catch (error) { Alert.alert('Error', 'No se cargaron temas.'); }
    finally { setIsLoadingTemas(false); }
  };

  const getItemId = (item) => item?.id_especialidad || item?.id_tipo || item?.id_tema || item?.id || item?.pk;
  const getItemName = (item) => (item?.nombre || item?.descripcion || 'SELECCIONADO').toUpperCase();

  const handleSelectItem = (item) => {
    const id = getItemId(item);
    setModalVisible(false);
    if (currentSelectionType === 'esp') {
      setSelectedEsp(item); setSelectedTipo(null); setSelectedTema(null);
      fetchTipos(id);
    } else if (currentSelectionType === 'tipo') {
      setSelectedTipo(item); setSelectedTema(null);
      fetchTemas(getItemId(selectedEsp), id);
    } else {
      setSelectedTema(item);
    }
  };

  const handleIniciar = async () => {
    if (!selectedEsp || !selectedTipo || !selectedTema || !selectedPreguntas) {
      Alert.alert('Atención', 'Por favor completa todos los campos.');
      return;
    }

    setIsCreating(true);
    try {
      await AsyncStorage.setItem('TOTALPREGS', '0');
      await AsyncStorage.setItem('TOTALPREGSCORRECTAS', '0');

      const response = await apiClient('/evaluaciones/training/', {
        method: 'POST',
        body: JSON.stringify({
          especialidades: [getItemId(selectedEsp)],
          tipos: [getItemId(selectedTipo)],
          temas: [getItemId(selectedTema)],
          numero_preguntas: String(selectedPreguntas)
        })
      });

      const data = await response.json();
      if (response.ok || data.status === 'success') {
        router.push({
          pathname: '/training-exam',
          params: {
            trainingId: data.data?.id_intento,
            totalLimit: String(selectedPreguntas)
          }
        });
      } else {
        Alert.alert('Error', data.message || 'Error al crear.');
      }
    } catch (error) { Alert.alert('Error', 'Error de conexión.'); }
    finally { setIsCreating(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader
        onOpenMenu={() => setMenuVisible(true)}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[globalStyles.headerText, { marginBottom: 0, textAlign: 'left' }]}>TRAINING</Text>
          <TouchableOpacity style={globalStyles.historialButton} onPress={() => router.push('/history')}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>

        <Text style={globalStyles.label}>ESPECIALIDAD</Text>
        <TouchableOpacity style={globalStyles.selectContainer} onPress={() => { setCurrentSelectionType('esp'); setModalData(especialidades); setModalVisible(true); }}>
          <Text style={[globalStyles.selectText, selectedEsp && { color: '#5F7282' }]}>
            {selectedEsp ? getItemName(selectedEsp) : 'ELIGE UNA ESPECIALIDAD'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#5F7282" />
        </TouchableOpacity>

        <Text style={globalStyles.label}>TIPO</Text>
        <TouchableOpacity
          style={[globalStyles.selectContainer, !selectedEsp && { opacity: 0.5 }]}
          disabled={!selectedEsp || isLoadingTipos}
          onPress={() => { setCurrentSelectionType('tipo'); setModalData(tipos); setModalVisible(true); }}
        >
          {isLoadingTipos ? <ActivityIndicator size="small" color="#9D489E" /> : (
            <Text style={[globalStyles.selectText, selectedTipo && { color: '#5F7282' }]}>
              {selectedTipo ? getItemName(selectedTipo) : 'ELIGE UN TIPO'}
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#5F7282" />
        </TouchableOpacity>

        <Text style={globalStyles.label}>TEMA</Text>
        <TouchableOpacity
          style={[globalStyles.selectContainer, !selectedTipo && { opacity: 0.5 }]}
          disabled={!selectedTipo || isLoadingTemas}
          onPress={() => { setCurrentSelectionType('tema'); setModalData(temas); setModalVisible(true); }}
        >
          {isLoadingTemas ? <ActivityIndicator size="small" color="#9D489E" /> : (
            <Text style={[globalStyles.selectText, selectedTema && { color: '#5F7282' }]}>
              {selectedTema ? getItemName(selectedTema) : 'ELIGE UN TEMA'}
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#5F7282" />
        </TouchableOpacity>

        <Text style={globalStyles.label}>NÚMERO DE PREGUNTAS</Text>
        <View style={globalStyles.questionGrid}>
          {opcionesPreguntas.map((num) => (
            <TouchableOpacity
              key={num}
              style={[globalStyles.questionOption, selectedPreguntas === num && globalStyles.questionOptionSelected]}
              onPress={() => setSelectedPreguntas(num)}
            >
              <Text style={[globalStyles.questionOptionText, selectedPreguntas === num && { color: 'white' }]}>
                {num} PREGUNTAS
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[globalStyles.primaryButton, { marginHorizontal: 30, marginTop: 10 }]}
          onPress={handleIniciar}
          disabled={isCreating}
        >
          {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>INICIAR</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 }} onPress={() => setModalVisible(false)}>
          <View style={{ backgroundColor: 'white', borderRadius: 15, padding: 20, maxHeight: '70%' }}>
            <Text style={{ fontWeight: 'bold', color: '#5F7282', marginBottom: 15, textAlign: 'center' }}>SELECCIONA UNA OPCIÓN</Text>
            <FlatList
              data={modalData}
              keyExtractor={(item, index) => (getItemId(item) || index).toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' }} onPress={() => handleSelectItem(item)}>
                  <Text style={{ color: '#5F7282', fontWeight: 'bold' }}>{getItemName(item)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}