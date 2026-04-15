import * as SecureStore from 'expo-secure-store';
import { SplashScreen, useRouter } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

type AuthState = {
  isLoggedIn: boolean;
  isReady: boolean;
  logIn: (token: string, userData: object) => Promise<void>;
  logOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  isReady: false,
  logIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        setIsLoggedIn(false);
      } finally {
        setIsReady(true);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  const logIn = async (token: string, userData: object) => {
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    setIsLoggedIn(true);
    router.replace('/dashboard');
  };

  const logOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setIsLoggedIn(false);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);