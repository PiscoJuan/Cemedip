import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function TrainingResults() {
  const router = useRouter();

  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#FFF' }}>
      <Text style={globalStyles.headerText}>RESULTADOS EXAMEN TRAINING</Text>

      <Text style={globalStyles.questionText}>PREGUNTA 3</Text>
      <Text style={{ marginBottom: 10 }}>En base a qué parámetro define usted la enfermedad pulmonar obstructiva crónica?</Text>

      <View style={[globalStyles.optionButton, globalStyles.correctOption]}>
        <Text style={{ color: '#FFF' }}>OPCIÓN 3</Text>
      </View>

      <Text style={{ fontWeight: 'bold', color: 'green', marginTop: 10 }}>RESPUESTA CORRECTA</Text>
      <Text>Por funcional respiratorio</Text>
      <Text style={{ fontStyle: 'italic', marginTop: 5 }}>La EPOC se define por un criterio funcional, no anatómico ni solo clínico ni por imágenes. El diagnóstico se confirma mediante espirometría.</Text>

      <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.replace('/dashboard')}>
        <Text style={globalStyles.primaryButtonText}>SIGUIENTE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}