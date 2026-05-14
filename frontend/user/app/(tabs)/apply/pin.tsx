import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loanAPI } from '../../../services/api';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function GlassCircle({ children, size = 50 }: { children: React.ReactNode; size?: number }) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={14}
        tint="dark"
        style={[
          styles.glassCircleBlur,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <View style={styles.glassCircleOverlay}>{children}</View>
      </BlurView>
    );
  }
  return (
    <View
      style={[
        styles.glassCircleAndroid,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {children}
    </View>
  );
}

export default function ApplyPinScreen() {
  const router = useRouter();
  const { draft, setResult, reset } = useLoanStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pressKey(key: string) {
    if (key === '⌫') setPin((p) => p.slice(0, -1));
    else if (key !== '' && pin.length < 6) setPin((p) => p + key);
  }

  async function handleSubmit() {
    if (pin.length < 6) return;
    if (!draft.loan_amnt || !draft.loan_intent || !draft.tenure_months) {
      router.replace('/(tabs)/apply');
      return;
    }
    setError('');
    setLoading(true);
    router.push('/(tabs)/apply/waiting');
    try {
      const res = await loanAPI.apply({
        loan_amnt: draft.loan_amnt,
        loan_intent: draft.loan_intent,
        tenure_months: draft.tenure_months,
        pin,
      });
      setResult(res.data);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setResult({ error: typeof detail === 'string' ? detail : 'Pengajuan gagal.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap} activeOpacity={0.8}>
          <GlassCircle size={50}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </GlassCircle>
        </TouchableOpacity>

        <Text style={styles.title}>Masukin PIN kamu</Text>
        <Text style={styles.subtitle}>supaya aman ya</Text>

        <View style={styles.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Gas</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 110 },

  glassCircleBlur: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder, overflow: 'hidden',
  },
  glassCircleOverlay: {
    flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass,
  },
  glassCircleAndroid: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },

  backBtnWrap: { marginBottom: 28, alignSelf: 'flex-start' },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 40 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  dotFilled: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
    shadowColor: 'rgba(30,215,96,0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  errorText: { color: Colors.red, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  numpad: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 16, marginTop: 20, marginBottom: 32,
  },
  numKey: {
    width: 72,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyEmpty: { backgroundColor: 'transparent' },
  numKeyText: { color: Colors.white, fontSize: 24, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.greenGlass,
    borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', paddingHorizontal: 40,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
