import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export const CustomDrawer = ({ visible, onClose }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    onClose();
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} onPress={onClose}>
        <View style={{width: '75%', height: '100%', backgroundColor: 'white', padding: 20, paddingTop: 60}}>
          <TouchableOpacity style={{flexDirection: 'row', marginBottom: 25}} onPress={() => {
            onClose();
            if (router.canGoBack()) {
              router.dismissAll();
            }
            router.replace('/dashboard');}
          }>
            <Ionicons name="home-outline" size={24} color="#9D489E" />
            <Text style={{marginLeft: 15, fontSize: 18}}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{flexDirection: 'row'}} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="red" />
            <Text style={{marginLeft: 15, fontSize: 18, color: 'red'}}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};