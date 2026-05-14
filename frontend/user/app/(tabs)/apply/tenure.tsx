import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';

const TENURES = [
  { label: '3 bulan', value: 3 },
  { label: '6 bulan', value: 6 },
  { label: '12 bulan', value: 12 },
  { label: '24 bulan', value: 24 },
];

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

export default function ApplyTenureScreen() {
  const router = useRouter();
  const { setTenure } = useLoanStore();
  const [selected, setSelected] = useState<number | null>(null);

  function handleNext() {
    if (!selected) return;
    setTenure(selected);
    router.push('/(tabs)/apply/confirm');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap} activeOpacity={0.8}>
          <GlassCircle size={50}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </GlassCircle>
        </TouchableOpacity>

        <Text style={styles.title}>Jatuh tempo</Text>
        <Text style={styles.subtitle}>kira-kira kamu bisa bayar maksimal dalam berapa bulan?</Text>

        <View style={styles.options}>
          {TENURES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.optPill, selected === t.value && styles.optPillSelected]}
              onPress={() => setSelected(t.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optPillText, selected === t.value && styles.optPillTextSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          onPress={handleNext}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Lanjut</Text>
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
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 36, lineHeight: 22 },
  options: { gap: 14, marginBottom: 40 },
  optPill: {
    height: 50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 999,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(32,32,32,0.85)',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  optPillSelected: { borderColor: Colors.green },
  optPillText: { color: Colors.grayLight, fontSize: 16, fontWeight: '500' },
  optPillTextSelected: { color: Colors.white },
  btn: {
    backgroundColor: Colors.greenGlass,
    borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', paddingHorizontal: 32,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
