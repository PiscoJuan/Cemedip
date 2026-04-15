import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importamos el router aquí dentro
import { globalStyles } from '../constants/globalStyles';

export const MainHeader = ({ onOpenMenu }) => {
  const router = useRouter();

  return (
    <View style={[globalStyles.headerContainer, { paddingHorizontal: 20 }]}>
      <TouchableOpacity onPress={onOpenMenu}>
        <Ionicons name="menu" size={38} color="#9D489E" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/profile')}>
        <Ionicons name="person-circle-outline" size={42} color="#9D489E" />
      </TouchableOpacity>
    </View>
  );
};