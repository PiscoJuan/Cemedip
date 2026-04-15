import { Stack } from 'expo-router';
import { AuthProvider } from '@/utils/authContext';

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}