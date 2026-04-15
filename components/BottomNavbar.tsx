import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export const BottomNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const getColor = (route: string) => (pathname === route ? '#FFF' : '#C1C1C1');

  return (
    <View style={globalStyles.navbar}>
      <TouchableOpacity
        onPress={() => {
          if (pathname !== '/dashboard') {
            if (router.canGoBack()) {
              router.dismissAll();
            }
            router.replace('/dashboard');}
        }}
      >
        <Ionicons name="home" size={28} color={getColor('/dashboard')}/>
      </TouchableOpacity>

      {/*<TouchableOpacity onPress={() => router.push('/search')}>*/}
      {/*  <Ionicons name="search" size={28} color={getColor('/search')} />*/}
      {/*</TouchableOpacity>*/}

      {/*<TouchableOpacity onPress={() => router.push('/notifications')}>*/}
      {/*  <Ionicons name="notifications" size={28} color={getColor('/notifications')} />*/}
      {/*</TouchableOpacity>*/}

      {/*<TouchableOpacity onPress={() => router.push('/settings')}>*/}
      {/*  <Ionicons name="settings" size={28} color={getColor('/settings')} />*/}
      {/*</TouchableOpacity>*/}
    </View>
  );
};