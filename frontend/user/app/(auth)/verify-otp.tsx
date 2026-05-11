import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { devOtp } = useLocalSearchParams<{ devOtp: string }>();
  const pendingPhone = useAuthStore(s => s.pendingPhone);
  const setToken = useAuthStore(s => s.setToken);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone: pendingPhone, code: otp });
      setToken(res.data.access_token, res.data.refresh_token);
      router.replace('/(onboarding)/setup');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Check your phone</Text>
      <Text style={styles.sub}>Enter the 6-digit code sent to {pendingPhone}</Text>

      {devOtp ? (
        <View style={styles.devBanner}>
          <Text style={styles.devText}>Dev OTP: {devOtp}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor={Colors.ink400}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Verify" onPress={submit} variant="primary" size="lg" fullWidth loading={loading} disabled={otp.length < 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: 24, paddingTop: 100 },
  heading: { fontFamily: Fonts.display, fontSize: 30, color: Colors.ink900, marginBottom: 8 },
  sub: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500, marginBottom: 32 },
  devBanner: { backgroundColor: Colors.mintDim, borderRadius: Radius.md, padding: 12, marginBottom: 24 },
  devText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.mint, textAlign: 'center' },
  field: { marginBottom: 24 },
  otpInput: {
    height: 64, borderRadius: Radius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.mint,
    fontFamily: Fonts.display, fontSize: 28, color: Colors.ink900, letterSpacing: 8,
  },
  error: { fontFamily: Fonts.body, fontSize: 13, color: Colors.reject, marginBottom: 12, textAlign: 'center' },
});
