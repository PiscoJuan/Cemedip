import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function ResetSuccess() {
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerText}>¡FINALIZADO!</Text>
      <Text style={globalStyles.subHeaderText}>Tu contraseña ha sido restablecida exitosamente</Text>

      <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.replace('/login')}>
        <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>
      </TouchableOpacity>
    </View>
  );
}