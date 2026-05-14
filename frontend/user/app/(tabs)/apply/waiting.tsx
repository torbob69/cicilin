import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';

export default function ApplyWaitingScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();

    // Use getState() to avoid stale closure — reads live Zustand state each tick
    const check = setInterval(() => {
      if (useLoanStore.getState().draft.result !== null) {
        clearInterval(check);
        router.replace('/(tabs)/apply/result');
      }
    }, 400);

    const timeout = setTimeout(() => {
      clearInterval(check);
      router.replace('/(tabs)/apply/result');
    }, 15000);

    return () => {
      anim.stop();
      clearInterval(check);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.illustrationArea}>
          <Animated.Text style={[styles.emoji, { transform: [{ scale: pulse }] }]}>⏳</Animated.Text>
          <View style={styles.personEmoji}>
            <Text style={styles.personText}>🧑‍💼</Text>
          </View>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>Tunggu bentar yah</Text>
          <Text style={styles.subtitle}>sistem kita lagi cek permintaan kamu</Text>

          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.loadDot, { opacity: 0.4 + i * 0.2 }]} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, justifyContent: 'space-between', paddingBottom: 80 },
  illustrationArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 0,
  },
  emoji: { fontSize: 100, lineHeight: 120 },
  personEmoji: { marginTop: -20 },
  personText: { fontSize: 80 },
  textArea: { paddingHorizontal: 32, paddingBottom: 20, alignItems: 'center' },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: Colors.gray, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  loadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
});
