import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI, userAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      setError('Nomor HP dan password wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(phone.trim(), password);
      const { access_token, refresh_token } = res.data;
      await setTokens(access_token, refresh_token);
      const meRes = await userAPI.getMe();
      setUser(meRes.data);
      router.replace('/(tabs)/');
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Login gagal. Periksa nomor HP dan password kamu.';
      setError(typeof msg === 'string' ? msg : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logo}>Cicilin</Text>
            <Text style={styles.tagline}>Pinjaman cepat, proses transparan</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Masuk ke akun kamu</Text>

            {/* Phone */}
            <View style={styles.inputWrap}>
              <Feather name="phone" size={18} color={Colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nomor HP (cth: 08xxxxxxxxxx)"
                placeholderTextColor={Colors.gray}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color={Colors.gray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Password"
                placeholderTextColor={Colors.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnText}>Masuk</Text>
              }
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.grayText}>Belum punya akun? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.greenLink}>Daftar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 40, fontWeight: '800', color: Colors.green, letterSpacing: -1 },
  tagline: { color: Colors.gray, fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '700', marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },
  errorText: { color: Colors.red, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: Colors.green,
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  grayText: { color: Colors.gray, fontSize: 14 },
  greenLink: { color: Colors.green, fontSize: 14, fontWeight: '600' },
});
