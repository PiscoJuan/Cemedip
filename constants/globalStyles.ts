import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5F7282',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 1,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#9D489E',
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120, // Un poco más grande para que luzca
    height: 120,
    alignSelf: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#5F7282',
    textAlign: 'center',
  },
  subLogoText: {
    fontSize: 8,
    color: '#5F7282',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F7282',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Gris muy claro del diseño
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    height: 55,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#5F7282',
  },
  primaryButton: {
    backgroundColor: '#9D489E', // El morado exacto
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    // Eliminamos el marginHorizontal excesivo para que se vea como en la foto
    marginHorizontal: 40,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkText: {
    color: '#5F7282',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
    textDecorationLine: 'underline',
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backText: {
    color: '#5F7282',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#5F7282',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: -40, // Para acercarlo al título
  },
  inputContainerBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9D489E', // Borde morado de la imagen
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    height: 65, // Un poco más altos como en la imagen
  },
  requirementsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F7282',
    marginBottom: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#00A19D', // El color verde/turquesa de los puntos
    marginBottom: 5,
    marginLeft: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 30,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 70,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9D489E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  otpText: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#5F7282',
  },
  timerText: {
    textAlign: 'center',
    color: '#5F7282',
    fontSize: 14,
    marginBottom: 40,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9D489E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 40,
  },
  secondaryButtonText: {
    color: '#9D489E',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});