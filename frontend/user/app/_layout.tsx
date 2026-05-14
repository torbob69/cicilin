import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../store/auth';
import { userAPI } from '../services/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadTokens, setUser, logout } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // @ts-ignore
      Text.defaultProps = { ...(Text.defaultProps ?? {}), style: { fontFamily: 'Inter_400Regular' } };
      // @ts-ignore
      TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: { fontFamily: 'Inter_400Regular' } };
      SplashScreen.hideAsync();
      bootstrap();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  async function bootstrap() {
    const { access } = await loadTokens();
    if (!access) {
      router.replace('/(auth)/login');
      return;
    }
    try {
      const res = await userAPI.getMe();
      const user = res.data;
      setUser(user);

      if (!user.is_verified) {
        router.replace('/(auth)/otp');
        return;
      }
      router.replace('/(tabs)/');
    } catch {
      await logout();
      router.replace('/(auth)/login');
    }
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="loan-detail" />
      </Stack>
    </>
  );
}
