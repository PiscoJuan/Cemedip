import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "../utils/apiClient";

const InputField = ({ label, value, onChange, editable = true, keyboardType = 'default' }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={[globalStyles.label, { marginBottom: 10 }]}>{label}</Text>
    <View style={[
      globalStyles.inputContainerBorder,
      !editable && { borderColor: '#DDD', backgroundColor: '#F9F9F9' }
    ]}>
      <TextInput
        style={[globalStyles.input, !editable && { color: '#AAA' }]}
        value={value}
        onChangeText={onChange}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={`Ingresa tu ${label.toLowerCase()}`}
      />
    </View>
  </View>
);

export default function ProfileEditScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    identificacion: '',
    correo_institucional: '',
    correo_personal: '',
    telefono_celular: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
    foto_perfil: null,
    foto_perfil_url: null
  });

  useEffect(() => { loadCurrentData(); }, []);

  const loadCurrentData = async () => {
    try {
      const res = await apiClient('/seguridad/perfil/');
      const json = await res.json();
      if (json.status === 'success') {
        setForm({
          ...json.data,
          foto_perfil_url: json.data.foto_perfil,
          foto_perfil: null
        });
      }
    } catch (e) { Alert.alert("Error", "No se cargaron los datos"); }
    finally { setLoading(false); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm({ ...form, foto_perfil: result.assets[0].uri });
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (selectedDate > new Date()) {
        Alert.alert("Fecha inválida", "La fecha de nacimiento no puede ser futura.");
        return;
      }
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, fecha_nacimiento: formattedDate });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('correo_personal', form.correo_personal);
      formData.append('telefono_celular', form.telefono_celular);
      formData.append('direccion', form.direccion);
      formData.append('fecha_nacimiento', form.fecha_nacimiento);
      formData.append('genero', form.genero);

      if (form.foto_perfil && form.foto_perfil.startsWith('file://')) {
        const uriParts = form.foto_perfil.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('foto_perfil', {
          uri: form.foto_perfil,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await apiClient('/seguridad/perfil/', {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.ok) {
        Alert.alert("Éxito", "Perfil actualizado correctamente.");
        router.back();
      }
    } catch (e) { Alert.alert("Error", "Error al guardar"); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color="#9D489E" /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={[globalStyles.headerContainer, { paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 15 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={30} color="#5F7282" />
          <Text style={{ color: '#5F7282', fontWeight: 'bold', fontSize: 16 }}>ATRÁS</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#9D489E' }}>EDITAR</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
           <Text style={{ color: '#9D489E', fontWeight: 'bold', fontSize: 16 }}>LISTO</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <TouchableOpacity onPress={pickImage} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEE', overflow: 'hidden', borderWidth: 3, borderColor: '#9D489E' }}>
            <Image
              source={{ uri: form.foto_perfil || form.foto_perfil_url }}
              style={{ width: '100%', height: '100%' }}
            />
            <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 4 }}>
              <Text style={{ color: '#FFF', fontSize: 10, textAlign: 'center' }}>CAMBIAR</Text>
            </View>
          </TouchableOpacity>
        </View>

        <InputField label="NOMBRES" value={form.nombres} editable={false} />
        <InputField label="APELLIDOS" value={form.apellidos} editable={false} />
        <InputField label="IDENTIFICACIÓN" value={form.identificacion} editable={false} />
        <InputField label="CORREO INSTITUCIONAL" value={form.correo_institucional} editable={false} />

        <InputField label="CORREO PERSONAL" value={form.correo_personal} onChange={(t) => setForm({...form, correo_personal: t})} />

        {/* AJUSTE: SOLO NÚMEROS Y MÁXIMO 10 DÍGITOS */}
        <InputField
          label="TELÉFONO CELULAR"
          value={form.telefono_celular}
          onChange={(t) => {
            const cleaned = t.replace(/[^0-9]/g, '');
            setForm({...form, telefono_celular: cleaned.slice(0, 10)});
          }}
          keyboardType="numeric"
        />

        <InputField label="DIRECCIÓN" value={form.direccion} onChange={(t) => setForm({...form, direccion: t})} />

        <Text style={[globalStyles.label, { marginBottom: 10 }]}>FECHA DE NACIMIENTO</Text>
        <TouchableOpacity
          style={[globalStyles.inputContainerBorder, { justifyContent: 'center' }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: '#5F7282' }}>{form.fecha_nacimiento || "Seleccionar fecha"}</Text>
          <Ionicons name="calendar-outline" size={20} color="#9D489E" style={{ position: 'absolute', right: 15 }} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={form.fecha_nacimiento ? new Date(form.fecha_nacimiento + "T12:00:00") : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <Text style={[globalStyles.label, { marginTop: 20, marginBottom: 15 }]}>GÉNERO</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          {['masculino', 'femenino', 'otro'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setForm({...form, genero: g})}
              style={[
                globalStyles.secondaryButton,
                { flex: 0.3, marginHorizontal: 0, height: 45 },
                form.genero === g && { backgroundColor: '#9D489E', borderColor: '#9D489E' }
              ]}
            >
              <Text style={[
                globalStyles.secondaryButtonText,
                { fontSize: 12 },
                form.genero === g && { color: '#FFF' }
              ]}>
                {g.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[globalStyles.primaryButton, { marginTop: 10, marginHorizontal: 0 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={globalStyles.primaryButtonText}>GUARDAR CAMBIOS</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}