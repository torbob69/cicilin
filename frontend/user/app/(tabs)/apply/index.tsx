import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../../services/api';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';
import { formatIDR, RANK_LOAN_LIMITS } from '../../../constants/helpers';

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

export default function ApplyAmountScreen() {
  const router = useRouter();
  const { setAmount } = useLoanStore();
  const [value, setValue] = useState('');
  const [rank, setRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userAPI.getRank().then((r) => { setRank(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const limit = rank ? RANK_LOAN_LIMITS[rank.rank] ?? 0 : 0;
  const numVal = parseInt(value.replace(/\D/g, ''), 10) || 0;

  function formatInput(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setValue(digits ? parseInt(digits).toLocaleString('id-ID') : '');
  }

  function handleNext() {
    if (numVal < 500000) { setError('Minimal pinjaman Rp 500.000'); return; }
    if (numVal > limit) { setError(`Melebihi limit bulanan kamu (${formatIDR(limit)})`); return; }
    setError('');
    setAmount(numVal);
    router.push('/(tabs)/apply/intent');
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap} activeOpacity={0.8}>
            <GlassCircle size={50}>
              <Feather name="chevron-left" size={22} color={Colors.green} />
            </GlassCircle>
          </TouchableOpacity>

          <Text style={styles.title}>Mau pinjam berapa?</Text>
          <Text style={styles.subtitle}>masukkin jumlah uang yang sesuai dengan kebutuhan ya</Text>

          {rank && (
            <View style={styles.limitInfo}>
              <Text style={styles.limitInfoText}>
                Limit kamu: <Text style={{ color: Colors.green, fontWeight: '700' }}>{formatIDR(limit)}</Text>
                {' '}· Bunga {rank.interest_rate}% p.a.
              </Text>
            </View>
          )}

          <View style={styles.inputWrap}>
            <Text style={styles.prefix}>Rp</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.gray}
              value={value}
              onChangeText={formatInput}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <Text style={styles.hint}>*minimal Rp 500.000</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, numVal < 500000 && styles.btnDisabled]}
            onPress={handleNext}
            disabled={numVal < 500000}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Lanjut</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
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
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 20, lineHeight: 22 },
  limitInfo: {
    backgroundColor: Colors.greenGlow, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.greenBorder, marginBottom: 24,
  },
  limitInfoText: { color: Colors.grayLight, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.glassBorder,
    paddingHorizontal: 20, height: 56,
  },
  prefix: { color: Colors.gray, fontSize: 16, fontWeight: '700', marginRight: 8 },
  input: { flex: 1, color: Colors.white, fontSize: 22, fontWeight: '700' },
  hint: { color: Colors.gray, fontSize: 12, marginTop: 8, marginLeft: 4 },
  errorText: { color: Colors.red, fontSize: 13, marginTop: 8 },
  btn: {
    backgroundColor: Colors.greenGlass,
    borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 32, alignSelf: 'flex-start', paddingHorizontal: 32,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
