import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerText}>BIENVENIDO, ALBERTO!</Text>

      <TouchableOpacity style={globalStyles.card} onPress={() => router.push('/training-setup')}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>TRAINING</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.card} onPress={() => router.push('/online-exam')}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>EXAMEN</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>PROGRESO</Text>
      <View style={globalStyles.card}>
        <Text>EXAMEN DE PRÁCTICA - 50% - 06/04/2026</Text>
      </View>
    </View>
  );
}