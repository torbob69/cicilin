import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts as useInter } from '@expo-google-fonts/inter';
import { Manrope_600SemiBold, Manrope_700Bold, useFonts as useManrope } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [manropeLoaded] = useManrope({ Manrope_700Bold, Manrope_600SemiBold });

  useEffect(() => {
    if (interLoaded && manropeLoaded) SplashScreen.hideAsync();
  }, [interLoaded, manropeLoaded]);

  if (!interLoaded || !manropeLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)/welcome" />
        <Stack.Screen name="(onboarding)/features" />
        <Stack.Screen name="(onboarding)/setup" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/verify-otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="kyc-upload" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="apply" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="processing" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
