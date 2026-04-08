// app/training-exam.tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles } from '../constants/globalStyles';

export default function TrainingExam() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ padding: 20 }}>
        <Text style={globalStyles.timerText}>TIEMPO RESTANTE: 10:00</Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>PREGUNTA 1</Text>
        <Text style={globalStyles.questionText}>
          En base a qué parámetro define usted la enfermedad pulmonar obstructiva crónica?
        </Text>

        <TouchableOpacity style={globalStyles.optionButton}><Text>OPCIÓN 1</Text></TouchableOpacity>
        <TouchableOpacity style={globalStyles.optionButton}><Text>OPCIÓN 2</Text></TouchableOpacity>
        <TouchableOpacity style={globalStyles.optionButton}><Text>OPCIÓN 3</Text></TouchableOpacity>
        <TouchableOpacity style={globalStyles.optionButton}><Text>OPCIÓN 4</Text></TouchableOpacity>

        <TouchableOpacity><Text style={globalStyles.linkText}>QUITAR SELECCIÓN</Text></TouchableOpacity>

        <TouchableOpacity style={globalStyles.primaryButton} onPress={() => router.push('/training-results')}>
          <Text style={globalStyles.primaryButtonText}>TERMINAR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}