import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function Login() {
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerText}>INICIAR SESIÓN</Text>

      <Text>USUARIO</Text>
      <TextInput style={globalStyles.input} placeholder="Usuario" />

      <Text>CONTRASEÑA</Text>
      <TextInput style={globalStyles.input} placeholder="************" secureTextEntry />

      <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.push('/dashboard')}>
        <Text style={globalStyles.primaryButtonText}>INGRESAR</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/recover-password')}>
        <Text style={globalStyles.linkText}>RECUPERAR CONTRASEÑA</Text>
      </TouchableOpacity>
    </View>
  );
}