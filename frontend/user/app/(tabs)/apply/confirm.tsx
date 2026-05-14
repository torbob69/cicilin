import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';
import { formatIDR, LOAN_INTENT_MAP, RANK_INTEREST_RATES } from '../../../constants/helpers';
import { useAuthStore } from '../../../store/auth';
import { userAPI } from '../../../services/api';

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

export default function ApplyConfirmScreen() {
  const router = useRouter();
  const { draft } = useLoanStore();
  const { user } = useAuthStore();
  const [rank, setRank] = useState<any>(null);

  useEffect(() => {
    userAPI.getRank().then((r) => setRank(r.data)).catch(() => {});
  }, []);

  const { loan_amnt, loan_intent, tenure_months } = draft;
  if (!loan_amnt || !loan_intent || !tenure_months) {
    router.replace('/(tabs)/apply');
    return null;
  }

  const rankName = rank?.rank ?? user?.rank ?? 'Gold';
  const interestRate = rank?.interest_rate ?? RANK_INTEREST_RATES[rankName] ?? 15;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyInstallment = monthlyRate > 0
    ? (loan_amnt * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / (Math.pow(1 + monthlyRate, tenure_months) - 1)
    : loan_amnt / tenure_months;
  const totalAmount = monthlyInstallment * tenure_months;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + tenure_months);
  const endDateStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap} activeOpacity={0.8}>
          <GlassCircle size={50}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </GlassCircle>
        </TouchableOpacity>

        <Text style={styles.title}>Konfirmasi ULANG</Text>
        <Text style={styles.subtitle}>lihat lagi detail dari permintaan kamu, teliti ya!</Text>

        <Text style={styles.loanLabel}>Kamu mau pinjam :</Text>
        <Text style={styles.loanAmount}>{formatIDR(loan_amnt)}</Text>
        <Text style={styles.loanDuration}>
          s/d <Text style={{ color: Colors.green }}>{endDateStr}</Text>{' '}
          (<Text style={{ color: Colors.green }}>{tenure_months} bulan</Text> dari sekarang)
        </Text>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{LOAN_INTENT_MAP[loan_intent] ?? loan_intent}</Text>
          </View>
          <View style={[styles.badge, styles.badgeRate]}>
            <Text style={styles.badgeText}>Bunga {interestRate}% (sesuai tier kamu)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.totalLabel}>Total akhir :</Text>
        <Text style={styles.totalAmount}>{formatIDR(totalAmount)}</Text>
        <Text style={styles.installmentHint}>
          Cicilan: {formatIDR(Math.round(monthlyInstallment))}/bulan × {tenure_months} bulan
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/(tabs)/apply/pin')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Gas</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 24, paddingTop: 60, paddingBottom: 110, flexGrow: 1 },

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
  subtitle: { color: Colors.gray, fontSize: 14, marginBottom: 32 },
  loanLabel: { color: Colors.gray, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  loanAmount: { color: Colors.white, fontSize: 32, fontWeight: '800', marginBottom: 6 },
  loanDuration: { color: Colors.gray, fontSize: 13, marginBottom: 20 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  badge: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20,20,20,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRate: { borderColor: Colors.redHard },
  badgeText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 24 },
  totalLabel: { color: Colors.gray, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  totalAmount: { color: Colors.green, fontSize: 40, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
  installmentHint: { color: Colors.gray, fontSize: 13, marginBottom: 36 },
  btn: {
    backgroundColor: Colors.greenGlass,
    borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', paddingHorizontal: 40,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
