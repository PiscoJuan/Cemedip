import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from "@/utils/apiClient"; // Importamos tu cliente

export const CustomDrawer = ({ visible, onClose }) => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient('/seguridad/perfil/');
      const json = await response.json();
      if (json.status === 'success') {
        setProfile(json.data);
      }
    } catch (e) {
      console.log("Error cargando perfil en drawer:", e);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    onClose();
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <View style={{ width: '75%', height: '100%', backgroundColor: 'white', padding: 20, paddingTop: 60 }}>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              borderWidth: 4,
              borderColor: '#9D489E',
              padding: 3,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <View style={{ flex: 1, width: '100%', borderRadius: 50, overflow: 'hidden', backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }}>
                {profile?.foto_perfil ? (
                  <Image
                    key={profile.foto_perfil}
                    source={{ uri: profile.foto_perfil }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Ionicons name="person" size={50} color="#CCC" />
                )}
              </View>
            </View>

            <Text style={{
              marginTop: 15,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#9D489E',
              textAlign: 'center'
            }}>
              {(profile?.nombres || 'USUARIO').toUpperCase()}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginBottom: 25, width: '100%' }} />

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}
            onPress={() => { onClose(); router.replace('/dashboard'); }}
          >
            <Ionicons name="home-outline" size={24} color="#9D489E" />
            <Text style={{ marginLeft: 15, fontSize: 16, color: '#5F7282' }}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}
            onPress={() => { onClose(); router.push('/profile'); }}
          >
            <Ionicons name="person-outline" size={24} color="#9D489E" />
            <Text style={{ marginLeft: 15, fontSize: 16, color: '#5F7282' }}>Mi Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', marginBottom: 40 }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={{ marginLeft: 15, fontSize: 16, color: '#FF3B30', fontWeight: 'bold' }}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};