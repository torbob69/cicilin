import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleRegister() {
    const { full_name, phone, email, password } = form;
    if (!full_name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError('Semua field wajib diisi');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.register({ full_name: full_name.trim(), phone: phone.trim(), email: email.trim(), password });
      router.push({ pathname: '/(auth)/otp', params: { phone: phone.trim(), purpose: 'registration' } });
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </TouchableOpacity>

          <Text style={styles.title}>Buat akun baru</Text>
          <Text style={styles.subtitle}>Daftar dan mulai pinjam dengan mudah</Text>

          {[
            { label: 'Nama lengkap', field: 'full_name' as const, icon: 'user', keyboard: 'default' },
            { label: 'Nomor HP', field: 'phone' as const, icon: 'phone', keyboard: 'phone-pad' },
            { label: 'Email', field: 'email' as const, icon: 'mail', keyboard: 'email-address' },
          ].map(({ label, field, icon, keyboard }) => (
            <View key={field} style={styles.inputWrap}>
              <Feather name={icon as any} size={18} color={Colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={label}
                placeholderTextColor={Colors.gray}
                value={form[field]}
                onChangeText={(v) => update(field, v)}
                keyboardType={keyboard as any}
                autoCapitalize={field === 'full_name' ? 'words' : 'none'}
              />
            </View>
          ))}

          {/* Password */}
          <View style={styles.inputWrap}>
            <Feather name="lock" size={18} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Password (min. 8 karakter)"
              placeholderTextColor={Colors.gray}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Daftar</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.grayText}>Sudah punya akun? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.greenLink}>Masuk</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 28 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 14, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.white, fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorText: { color: Colors.red, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  grayText: { color: Colors.gray, fontSize: 14 },
  greenLink: { color: Colors.green, fontSize: 14, fontWeight: '600' },
});
