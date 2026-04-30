import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';
import { apiClient } from "../utils/apiClient";
import { BottomNavbar } from '../components/BottomNavbar';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      if (!profile) setLoading(true);

      const response = await apiClient('/seguridad/perfil/');
      const json = await response.json();
      if (json.status === 'success') setProfile(json.data);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color="#9D489E" /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={[globalStyles.headerContainer, { paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 15 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={30} color="#5F7282" />
          <Text style={{ color: '#5F7282', fontWeight: 'bold', fontSize: 16 }}>ATRÁS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile-edit')}>
          <Text style={{ color: '#5F7282', fontWeight: 'bold', fontSize: 16 }}>EDITAR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: '#9D489E', padding: 5 }}>
            <View style={{ flex: 1, borderRadius: 65, overflow: 'hidden', backgroundColor: '#EEE', justifyContent:'center', alignItems:'center' }}>
              {profile?.foto_perfil ? (
                <Image
                  key={profile.foto_perfil}
                  source={{ uri: profile.foto_perfil }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Ionicons name="person" size={80} color="#CCC" />
              )}
            </View>
          </View>
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#5F7282', letterSpacing: 1 }}>INFORMACIÓN PERSONAL</Text>
        </View>

        <InfoBlock icon="person-circle-outline" label="NOMBRES" value={profile?.nombres} />
        <InfoBlock icon="person-circle-outline" label="APELLIDOS" value={profile?.apellidos} />
        <InfoBlock icon="school-outline" label="UNIVERSIDAD" value={profile?.universidad} />
        <InfoBlock icon="calendar-outline" label="FECHA DE NACIMIENTO" value={profile?.fecha_nacimiento} />
        <InfoBlock icon="male-female-outline" label="GÉNERO" value={profile?.genero} />
        <InfoBlock icon="card-outline" label="IDENTIFICACIÓN" value={profile?.identificacion} />
        <InfoBlock icon="mail-outline" label="CORREO INSTITUCIONAL" value={profile?.correo_institucional} />
        <InfoBlock icon="mail-open-outline" label="CORREO PERSONAL" value={profile?.correo_personal} />
        <InfoBlock icon="phone-portrait-outline" label="TELÉFONO CELULAR" value={profile?.telefono_celular} />
        <InfoBlock icon="call-outline" label="TELÉFONO CONVENCIONAL" value={profile?.telefono_convencional} />

        <TouchableOpacity style={[globalStyles.primaryButton, { backgroundColor: '#A5559F' }]} onPress={() => Alert.alert("Atención", "¿Seguro que deseas eliminar tu cuenta?")}>
          <Text style={globalStyles.primaryButtonText}>ELIMINAR CUENTA</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavbar />
    </SafeAreaView>
  );
}

const InfoBlock = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingHorizontal: 25 }}>
    <Ionicons name={icon} size={32} color="#5F7282" style={{ marginRight: 15 }} />
    <View>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#5F7282' }}>{label}</Text>
      <Text style={{ fontSize: 15, color: '#8A97A0' }}>{value || 'No disponible'}</Text>
    </View>
  </View>
);