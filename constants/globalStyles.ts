import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A2BE2', // Purple brand color
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#8A2BE2',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  timerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    marginVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#EEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#00C9A7', // Teal color for selection
  },
  correctOption: {
    backgroundColor: '#FF0055', // Red/Pink for correct/incorrect highlights based on design
  }
});