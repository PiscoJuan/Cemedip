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
import { MainHeader } from "@/components/MainHeader";

export default function TrainingSetup() {
  const router = useRouter();

  const [especialidades, setEspecialidades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [temas, setTemas] = useState([]);

  const [isLoadingEsp, setIsLoadingEsp] = useState(true);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [isLoadingTemas, setIsLoadingTemas] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedEsp, setSelectedEsp] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState([]);
  const [selectedTema, setSelectedTema] = useState([]);
  const [selectedPreguntas, setSelectedPreguntas] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [currentSelectionType, setCurrentSelectionType] = useState(null);

  const opcionesPreguntas = [5, 10, 20, 25, 30, 40, 50, 100];

  useEffect(() => { fetchEspecialidades(); }, []);

  const getItemId = (item) => item?.id_especialidad || item?.id_tipo || item?.id_tema || item?.id || item?.pk;
  const getItemName = (item) => (item?.nombre || item?.descripcion || 'SELECCIONADO').toUpperCase();

  const fetchEspecialidades = async () => {
    setIsLoadingEsp(true);
    try {
      const response = await apiClient('/preguntas/especialidades/');
      const data = await response.json();
      setEspecialidades(data.data || data || []);
    } catch (error) { Alert.alert('Error', 'No se cargaron especialidades.'); }
    finally { setIsLoadingEsp(false); }
  };

  const fetchTipos = async (espIds) => {
    if (!espIds || espIds.length === 0) {
      setTipos([]);
      return;
    }
    setIsLoadingTipos(true);
    try {
      const params = espIds.map(id => `especialidades=${id}`).join('&');

      console.log("Fetching tipos con params:", params);
      const response = await apiClient(`/preguntas/tipos/?${params}`);
      const data = await response.json();
      setTipos(data.data || data || []);
    } catch (error) {
      Alert.alert('Error', 'No se cargaron tipos.');
    } finally {
      setIsLoadingTipos(false);
    }
  };

  const fetchTemas = async (espIds, tipoIds) => {
    if (!tipoIds || tipoIds.length === 0) {
      setTemas([]);
      return;
    }
    setIsLoadingTemas(true);
    try {
      const espParams = espIds.map(id => `especialidades=${id}`).join('&');
      const tipoParams = tipoIds.map(id => `tipos=${id}`).join('&');

      const fullParams = `${espParams}&${tipoParams}`;

      console.log("Fetching temas con params:", fullParams); // Debug
      const response = await apiClient(`/preguntas/temas/?${fullParams}`);
      const data = await response.json();
      setTemas(data.data || data || []);
    } catch (error) {
      Alert.alert('Error', 'No se cargaron temas.');
    } finally {
      setIsLoadingTemas(false);
    }
  };

  const handleSelectItem = (item) => {
    const id = getItemId(item);

    if (currentSelectionType === 'esp') {
      const isSelected = selectedEsp.some(i => getItemId(i) === id);
      const newList = isSelected ? selectedEsp.filter(i => getItemId(i) !== id) : [...selectedEsp, item];
      setSelectedEsp(newList);
      setSelectedTipo([]);
      setSelectedTema([]);
      setTipos([]);
      fetchTipos(newList.map(i => getItemId(i)));
    }
    else if (currentSelectionType === 'tipo') {
      const isSelected = selectedTipo.some(i => getItemId(i) === id);
      const newList = isSelected ? selectedTipo.filter(i => getItemId(i) !== id) : [...selectedTipo, item];
      setSelectedTipo(newList);
      setSelectedTema([]);
      fetchTemas(selectedEsp.map(i => getItemId(i)), newList.map(i => getItemId(i)));
    }
    else {
      const isSelected = selectedTema.some(i => getItemId(i) === id);
      const newList = isSelected ? selectedTema.filter(i => getItemId(i) !== id) : [...selectedTema, item];
      setSelectedTema(newList);
    }
  };

  const handleIniciar = async () => {
    if (selectedEsp.length === 0 || selectedTipo.length === 0 || selectedTema.length === 0 || !selectedPreguntas) {
      Alert.alert('Atención', 'Por favor selecciona al menos un elemento de cada categoría.');
      return;
    }

    setIsCreating(true);

    const payload = {
      especialidades: selectedEsp.map(i => getItemId(i)),
      tipos: selectedTipo.map(i => getItemId(i)),
      temas: selectedTema.map(i => getItemId(i)),
      numero_preguntas: String(selectedPreguntas)
    };

    try {
      await AsyncStorage.setItem('TOTALPREGS', '0');
      await AsyncStorage.setItem('TOTALPREGSCORRECTAS', '0');

      const response = await apiClient('/evaluaciones/training/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok || data.status === 'success') {
        router.push({
          pathname: '/training-exam',
          params: { trainingId: data.data?.id_intento, totalLimit: String(selectedPreguntas) }
        });
      } else {
        Alert.alert('Error', data.message || 'Error al crear el entrenamiento.');
      }
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(
          'Sesión Expirada',
          'Su token de sesión expiró. Por favor, inicie sesión nuevamente.',
          [{
            text: 'OK',
            onPress: () => router.replace('/login')
          }]
        );
      } else {
        console.error("🔥 Error de red:", error);
        Alert.alert('Error', 'No se pudo conectar con el servidor.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const getDisplayText = (list, placeholder) => {
    if (list.length === 0) return placeholder;
    if (list.length === 1) return getItemName(list[0]);
    return `${list.length} SELECCIONADOS`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <MainHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[globalStyles.headerText, { marginBottom: 0, textAlign: 'left' }]}>TRAINING</Text>
          <TouchableOpacity style={globalStyles.historialButton} onPress={() => router.push('/history')}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>

        <Text style={globalStyles.label}>ESPECIALIDADES</Text>
        <TouchableOpacity style={globalStyles.selectContainer} onPress={() => { setCurrentSelectionType('esp'); setModalData(especialidades); setModalVisible(true); }}>
          <Text style={[globalStyles.selectText, selectedEsp.length > 0 && { color: '#5F7282' }]}>
            {getDisplayText(selectedEsp, 'ELIGE ESPECIALIDADES')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#5F7282" />
        </TouchableOpacity>

        <Text style={globalStyles.label}>TIPOS</Text>
        <TouchableOpacity
          style={[globalStyles.selectContainer, selectedEsp.length === 0 && { opacity: 0.5 }]}
          disabled={selectedEsp.length === 0 || isLoadingTipos}
          onPress={() => { setCurrentSelectionType('tipo'); setModalData(tipos); setModalVisible(true); }}
        >
          {isLoadingTipos ? <ActivityIndicator size="small" color="#9D489E" /> : (
            <Text style={[globalStyles.selectText, selectedTipo.length > 0 && { color: '#5F7282' }]}>
              {getDisplayText(selectedTipo, 'ELIGE TIPOS')}
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#5F7282" />
        </TouchableOpacity>

        <Text style={globalStyles.label}>TEMAS</Text>
        <TouchableOpacity
          style={[globalStyles.selectContainer, selectedTipo.length === 0 && { opacity: 0.5 }]}
          disabled={selectedTipo.length === 0 || isLoadingTemas}
          onPress={() => { setCurrentSelectionType('tema'); setModalData(temas); setModalVisible(true); }}
        >
          {isLoadingTemas ? <ActivityIndicator size="small" color="#9D489E" /> : (
            <Text style={[globalStyles.selectText, selectedTema.length > 0 && { color: '#5F7282' }]}>
              {getDisplayText(selectedTema, 'ELIGE TEMAS')}
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

        <TouchableOpacity style={[globalStyles.primaryButton, { marginHorizontal: 30, marginTop: 10 }]} onPress={handleIniciar} disabled={isCreating}>
          {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>INICIAR</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 }} onPress={() => setModalVisible(false)}>
          <View style={{ backgroundColor: 'white', borderRadius: 15, padding: 20, maxHeight: '80%' }}>
            <Text style={{ fontWeight: 'bold', color: '#5F7282', marginBottom: 5, textAlign: 'center' }}>SELECCIONA OPCIONES</Text>
            <Text style={{ fontSize: 10, color: '#9D489E', marginBottom: 15, textAlign: 'center' }}>Puedes marcar varias</Text>

            <FlatList
              data={modalData}
              keyExtractor={(item, index) => (getItemId(item) || index).toString()}
              renderItem={({ item }) => {
                const id = getItemId(item);
                let isChecked = false;
                if(currentSelectionType==='esp') isChecked = selectedEsp.some(i => getItemId(i) === id);
                if(currentSelectionType==='tipo') isChecked = selectedTipo.some(i => getItemId(i) === id);
                if(currentSelectionType==='tema') isChecked = selectedTema.some(i => getItemId(i) === id);

                return (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: '#EEE',
                      backgroundColor: isChecked ? '#F9F0F9' : 'transparent',
                      paddingHorizontal: 10,
                      borderRadius: 8
                    }}
                    onPress={() => handleSelectItem(item)}
                  >
                    <Text style={{ color: isChecked ? '#9D489E' : '#5F7282', fontWeight: isChecked ? 'bold' : 'normal', flex: 1 }}>
                        {getItemName(item)}
                    </Text>
                    {isChecked && <Ionicons name="checkmark-circle" size={20} color="#9D489E" />}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[globalStyles.primaryButton, { marginTop: 20, marginHorizontal: 0 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={globalStyles.primaryButtonText}>LISTO</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}