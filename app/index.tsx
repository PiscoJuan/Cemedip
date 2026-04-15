import { useContext } from 'react';
import { Redirect } from 'expo-router';
import { AuthContext } from '@/utils/authContext';

export default function Index() {
  const { isLoggedIn, isReady } = useContext(AuthContext);

  if (!isReady) return null;

  return isLoggedIn
    ? <Redirect href="/dashboard" />
    : <Redirect href="/login" />;
}