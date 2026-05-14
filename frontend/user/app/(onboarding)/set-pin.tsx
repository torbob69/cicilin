import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function SetPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pressKey(key: string) {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
    } else if (key === '') {
      return;
    } else if (pin.length < 6) {
      setPin((p) => p + key);
    }
  }

  async function handleSubmit() {
    if (pin.length < 6) { setError('PIN harus 6 digit'); return; }
    setError('');
    setLoading(true);
    try {
      await userAPI.setPin(pin);
      router.replace('/(onboarding)/kyc');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Gagal menyimpan PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.green} />
        </TouchableOpacity>

        <Text style={styles.title}>Buat PIN kamu</Text>
        <Text style={styles.subtitle}>PIN dipakai buat konfirmasi pinjaman. Jangan kasih ke siapapun!</Text>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Numpad */}
        <View style={styles.numpad}>
          {NUMPAD.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numKey, key === '' && styles.numKeyEmpty]}
              onPress={() => pressKey(key)}
              disabled={key === ''}
              activeOpacity={0.7}
            >
              <Text style={[styles.numKeyText, key === '⌫' && { color: Colors.red }]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, (pin.length < 6 || loading) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={pin.length < 6 || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Simpan PIN</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.gray, fontSize: 14, marginBottom: 40, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Colors.green, borderColor: Colors.green },
  errorText: { color: Colors.red, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 20, marginBottom: 32 },
  numKey: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent' },
  numKeyText: { color: Colors.white, fontSize: 24, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
