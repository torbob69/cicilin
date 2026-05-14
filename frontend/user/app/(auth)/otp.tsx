import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI, userAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

export default function OTPScreen() {
  const router = useRouter();
  const { phone, purpose = 'registration' } = useLocalSearchParams<{ phone: string; purpose: string }>();
  const { setTokens, setUser } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  function handleDigit(index: number, val: string) {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = cleaned;
    setCode(next);
    if (cleaned && index < 5) refs.current[index + 1]?.focus();
    if (!cleaned && index > 0) refs.current[index - 1]?.focus();
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Masukkan 6 digit kode OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, fullCode, purpose);
      const { access_token, refresh_token } = res.data;
      await setTokens(access_token, refresh_token);
      const meRes = await userAPI.getMe();
      setUser(meRes.data);
      router.replace('/(onboarding)/set-pin');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Kode OTP salah atau kadaluarsa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    try {
      await authAPI.resendOTP(phone);
      setResendTimer(60);
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </TouchableOpacity>

          <Text style={styles.title}>Masukkin kode OTP</Text>
          <Text style={styles.subtitle}>
            Kode dikirim ke <Text style={{ color: Colors.white }}>{phone}</Text> via WhatsApp
          </Text>

          <View style={styles.dotsRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { refs.current[i] = r; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(v) => handleDigit(i, v)}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
                selectionColor={Colors.green}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Verifikasi</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} style={styles.resendBtn}>
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
              {resendTimer > 0 ? `Kirim ulang dalam ${resendTimer}s` : 'Kirim ulang kode'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 36 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpBox: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, color: Colors.white, fontSize: 22, fontWeight: '700',
  },
  otpBoxFilled: { borderColor: Colors.green },
  errorText: { color: Colors.red, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', marginTop: 20 },
  resendText: { color: Colors.green, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: Colors.gray },
});
