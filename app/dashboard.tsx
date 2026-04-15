import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native'; // <-- Added Image here
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { globalStyles } from '../constants/globalStyles';
import { CustomDrawer } from '../components/CustomDrawer';
import { BottomNavbar } from '../components/BottomNavbar';
import { router } from "expo-router";
import {MainHeader} from "@/components/MainHeader";

export default function Dashboard() {
  const [userName, setUserName] = useState('USUARIO');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const data = await SecureStore.getItemAsync('userData');
      if (data) {
        const user = JSON.parse(data);
        setUserName((user.nombre_completo?.split(' ')[0] || 'ALBERTO').toUpperCase());
      }
    };
    loadUser();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <MainHeader
        onOpenMenu={() => setMenuVisible(true)}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <Text style={globalStyles.welcomeText}>BIENVENIDO, {userName}!</Text>

        <TouchableOpacity style={globalStyles.mainCard} onPress={() => router.push('/training-setup')}>
          <View style={globalStyles.iconContainer}>
            <Image
              source={require('../assets/images/Recurso 11.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <Text style={globalStyles.mainCardText}>TRAINING</Text>
          <Ionicons name="chevron-forward" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.mainCard}>
          <View style={globalStyles.iconContainer}>
             <Image
              source={require('../assets/images/Recurso 12.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <Text style={globalStyles.mainCardText}>EXAMEN</Text>
          <Ionicons name="chevron-forward" size={30} color="white" />
        </TouchableOpacity>

        <Text style={globalStyles.sectionTitle}>PROGRESO</Text>

        {[50, 10].map((val, i) => (
          <View key={i} style={globalStyles.progressCard}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#5F7282" />
            <View style={globalStyles.progressTextContainer}>
              <Text style={globalStyles.progressTitle}>EXAMEN DE PRÁCTICA</Text>
              <Text style={globalStyles.progressSub}>ESPECIALIDAD, TEMA</Text>
              <Text style={globalStyles.progressSub}>06/04/2026</Text>
            </View>
            <Text style={globalStyles.progressPercent}>{val}%</Text>
          </View>
        ))}
      </ScrollView>

      <CustomDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <BottomNavbar />
    </SafeAreaView>
  );
}