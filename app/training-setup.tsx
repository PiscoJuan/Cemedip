  import React, { useState, useEffect } from 'react';
  import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal, FlatList } from 'react-native';
  import { useRouter } from 'expo-router';
  import * as SecureStore from 'expo-secure-store';
  import { globalStyles } from '../constants/globalStyles';
  import {apiClient} from "@/utils/apiClient";

  export default function TrainingSetup() {
    const router = useRouter();

    // Estados de datos de la API
    const [especialidades, setEspecialidades] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [temas, setTemas] = useState([]);

    // Estados de carga
    const [isLoadingEsp, setIsLoadingEsp] = useState(true);
    const [isLoadingTipos, setIsLoadingTipos] = useState(false);
    const [isLoadingTemas, setIsLoadingTemas] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Estados de selecciones del usuario
    const [selectedEsp, setSelectedEsp] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [selectedTema, setSelectedTema] = useState(null);
    const [selectedPreguntas, setSelectedPreguntas] = useState(null);

    // Estados para el Modal (Dropdown personalizado)
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [currentSelectionType, setCurrentSelectionType] = useState(null);

    const opcionesPreguntas = [5, 10, 20, 25, 30, 40, 50, 100];

    // ==========================================
    // FUNCIONES DE AYUDA (Extraen el nombre y el ID correcto)
    // ==========================================
    const getItemId = (item) => item?.id_especialidad || item?.id_tipo || item?.id_tema || item?.id || item?.pk;
    const getItemName = (item) => item?.nombre || item?.descripcion || item?.name || 'Seleccionado';

    // 1. Cargar Especialidades al iniciar
    useEffect(() => {
      fetchEspecialidades();
    }, []);

    const fetchEspecialidades = async () => {
      setIsLoadingEsp(true);
      try {
        const response = await apiClient('/preguntas/especialidades/');
        const data = await response.json();
        setEspecialidades(data.data || data || []);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las especialidades.');
      } finally {
        setIsLoadingEsp(false);
      }
    };

    // 2. Cargar Tipos basados en la Especialidad
    const fetchTipos = async (espId) => {
      setIsLoadingTipos(true);
      try {
        const response = await apiClient(`/preguntas/tipos/?especialidades=${espId}`);
        const data = await response.json();
        setTipos(data.data || data || []);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los tipos.');
      } finally {
        setIsLoadingTipos(false);
      }
    };

    // 3. Cargar Temas basados en Especialidad y Tipo
    const fetchTemas = async (espId, tipoId) => {
      setIsLoadingTemas(true);
      try {
        const response = await apiClient(`/preguntas/temas/?especialidades=${espId}&tipos=${tipoId}`);
        const data = await response.json();
        setTemas(data.data || data || []);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los temas.');
      } finally {
        setIsLoadingTemas(false);
      }
    };

    // Lógica para abrir el modal correcto
    const openModal = (type) => {
      setCurrentSelectionType(type);
      if (type === 'esp') setModalData(especialidades);
      if (type === 'tipo') setModalData(tipos);
      if (type === 'tema') setModalData(temas);
      setModalVisible(true);
    };

    // Lógica al seleccionar un ítem de la lista
    const handleSelectItem = (item) => {
      setModalVisible(false);

      const itemId = getItemId(item);

      if (currentSelectionType === 'esp') {
        setSelectedEsp(item);
        setSelectedTipo(null);
        setSelectedTema(null);
        setTipos([]);
        setTemas([]);
        fetchTipos(itemId);
      } else if (currentSelectionType === 'tipo') {
        setSelectedTipo(item);
        setSelectedTema(null);
        setTemas([]);
        fetchTemas(getItemId(selectedEsp), itemId);
      } else if (currentSelectionType === 'tema') {
        setSelectedTema(item);
      }
    };

    const handleContinuar = async () => {
      // ==========================================
      // NOTA: Descomenta esta validación cuando termines tus pruebas
      // if (!selectedEsp || !selectedTipo || !selectedTema || !selectedPreguntas) {
      //   Alert.alert('Atención', 'Por favor completa todos los campos antes de continuar.');
      //   return;
      // }
      // ==========================================

      setIsCreating(true);

      try {
        const token = await SecureStore.getItemAsync('userToken');

        if (!token) {
          Alert.alert('Error', 'No hay sesión activa. Vuelve a iniciar sesión.');
          setIsCreating(false);
          return;
        }

        // Usamos getItemId para asegurar que mandamos el número correcto al backend
        const espId = selectedEsp ? getItemId(selectedEsp) : 9;
        const tipoId = selectedTipo ? getItemId(selectedTipo) : 32;
        const temaId = selectedTema ? getItemId(selectedTema) : 233;
        const cantPreguntas = selectedPreguntas || 5;

        const response = await apiClient('/evaluaciones/training/', {
          method: 'POST',
          body: JSON.stringify({
            especialidades: [espId],
            tipos: [tipoId],
            temas: [temaId],
            numero_preguntas: String(cantPreguntas)
          })
        });


        const data = await response.json();
        console.log("=== RESPUESTA AL CREAR TRAINING ===", JSON.stringify(data, null, 2));

        if (response.ok || data.status === 'success' || data.statusCode === 201) {

        // ¡AQUÍ ESTÁ LA MAGIA! Capturamos id_intento directamente
        const newTrainingId = data.data?.id_intento;

        router.push({
          pathname: '/training-exam',
          params: { trainingId: newTrainingId }
        });
      } else {
        Alert.alert('Error', data.message || data.error || 'No se pudo crear el training.');
      }

      } catch (error) {
        console.error('Error creando training:', error);
        Alert.alert('Error', 'Problema de conexión con el servidor.');
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingVertical: 40 }}>
          <Text style={globalStyles.headerText}>TRAINING</Text>

          <Text style={[globalStyles.label, { marginTop: 20 }]}>ESPECIALIDAD</Text>
          <TouchableOpacity
            style={globalStyles.card}
            onPress={() => openModal('esp')}
            disabled={isLoadingEsp}
          >
            {isLoadingEsp ? <ActivityIndicator color="#8A2BE2" /> : (
              <Text style={{ color: selectedEsp ? '#000' : '#555', fontWeight: selectedEsp ? 'bold' : 'normal' }}>
                {selectedEsp ? getItemName(selectedEsp) : 'ELIGE UNA ESPECIALIDAD ▼'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[globalStyles.label, { marginTop: 20 }]}>TIPO DE ESPECIALIDAD</Text>
          <TouchableOpacity
            style={[globalStyles.card, !selectedEsp && { opacity: 0.5 }]}
            onPress={() => openModal('tipo')}
            disabled={!selectedEsp || isLoadingTipos}
          >
            {isLoadingTipos ? <ActivityIndicator color="#8A2BE2" /> : (
              <Text style={{ color: selectedTipo ? '#000' : '#555', fontWeight: selectedTipo ? 'bold' : 'normal' }}>
                {selectedTipo ? getItemName(selectedTipo) : 'ELIGE UN TIPO ▼'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[globalStyles.label, { marginTop: 20 }]}>TEMA</Text>
          <TouchableOpacity
            style={[globalStyles.card, !selectedTipo && { opacity: 0.5 }]}
            onPress={() => openModal('tema')}
            disabled={!selectedTipo || isLoadingTemas}
          >
            {isLoadingTemas ? <ActivityIndicator color="#8A2BE2" /> : (
              <Text style={{ color: selectedTema ? '#000' : '#555', fontWeight: selectedTema ? 'bold' : 'normal' }}>
                {selectedTema ? getItemName(selectedTema) : 'ELIGE UN TEMA ▼'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[globalStyles.label, { marginTop: 20 }]}>NÚMERO DE PREGUNTAS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 }}>
            {opcionesPreguntas.map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  globalStyles.card,
                  { width: '48%', padding: 15, alignItems: 'center' },
                  selectedPreguntas === num && { borderColor: '#8A2BE2', borderWidth: 2 }
                ]}
                onPress={() => setSelectedPreguntas(num)}
              >
                <Text style={{ fontWeight: selectedPreguntas === num ? 'bold' : 'normal', color: selectedPreguntas === num ? '#8A2BE2' : '#000' }}>
                  {num} PREGUNTAS
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[globalStyles.primaryButton, isCreating && { opacity: 0.7 }]}
            onPress={handleContinuar}
            disabled={isCreating}
          >
            {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 20, maxHeight: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Selecciona una opción</Text>

              {modalData.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#555', padding: 20 }}>No hay opciones disponibles</Text>
              ) : (
                <FlatList
                  data={modalData}
                  keyExtractor={(item, index) => (getItemId(item) || index).toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' }}
                      onPress={() => handleSelectItem(item)}
                    >
                      <Text style={{ fontSize: 16 }}>{getItemName(item)}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity
                style={{ marginTop: 20, padding: 15, backgroundColor: '#EEE', borderRadius: 8, alignItems: 'center' }}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ fontWeight: 'bold', color: '#333' }}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }