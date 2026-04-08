import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function RecoverPassword() {
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerText}>RECUPERA TU CONTRASEÑA</Text>
      <Text style={globalStyles.subHeaderText}>Por favor, escribe tu nueva contraseña</Text>

      <TextInput style={globalStyles.input} placeholder="CONTRASEÑA NUEVA" secureTextEntry />
      <TextInput style={globalStyles.input} placeholder="INGRESE CONTRASEÑA DE NUEVO" secureTextEntry />

      <View style={{ marginBottom: 20 }}>
        <Text>☑ TU CONTRASEÑA DEBE TENER:</Text>
        <Text>• Tener al menos 8 caracteres.</Text>
        <Text>• Tener una letra Mayúscula.</Text>
        <Text>• Tener un número o símbolo.</Text>
      </View>

      <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.push('/verify-code')}>
        <Text style={globalStyles.primaryButtonText}>CONTINUAR</Text>
      </TouchableOpacity>
    </View>
  );
}