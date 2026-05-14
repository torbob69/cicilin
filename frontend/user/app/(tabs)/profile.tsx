import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { userAPI } from '../../services/api';
import { Colors, RankColors } from '../../constants/colors';
import { formatIDR, RANK_XP_THRESHOLDS, RANK_LOAN_LIMITS } from '../../constants/helpers';
import GlassCard from '../../components/GlassCard';

function GlassCircle({ children, size = 50 }: { children: React.ReactNode; size?: number }) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={14} tint="dark"
        style={[styles.glassCircleBlur, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={styles.glassCircleOverlay}>{children}</View>
      </BlurView>
    );
  }
  return (
    <View style={[styles.glassCircleAndroid, { width: size, height: size, borderRadius: size / 2 }]}>
      {children}
    </View>
  );
}

const RANK_EMOJI_BIG: Record<string, string> = {
  Ruby: '💎', Diamond: '🔷', Platinum: '🌟', Gold: '🥇', Silver: '🥈', Bronze: '🥉', Iron: '⚙️',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [rank, setRank] = useState<any>(null);
  const [employment, setEmployment] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [rankRes, meRes] = await Promise.all([
        userAPI.getRank(),
        userAPI.getMe(),
      ]);
      setRank(rankRes.data);
      setUser(meRes.data);
      const banks = await userAPI.listBankAccounts().catch(() => ({ data: [] }));
      setBankAccounts(banks.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  async function handleLogout() {
    Alert.alert('Keluar', 'Yakin mau keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} />
      </SafeAreaView>
    );
  }

  const rankName = rank?.rank ?? user?.rank ?? 'Gold';
  const xp = rank?.xp ?? user?.xp ?? 0;
  const rankColors = RankColors[rankName] ?? RankColors.Iron;
  const thresholds = RANK_XP_THRESHOLDS[rankName] ?? [0, 100];
  const xpMin = thresholds[0];
  const xpMax = thresholds[1] ?? xp + 100;
  const xpProgress = xpMax > xpMin ? (xp - xpMin) / (xpMax - xpMin) : 1;
  const monthlyLimit = RANK_LOAN_LIMITS[rankName] ?? 0;
  const primaryBank = bankAccounts.find((b) => b.is_primary) ?? bankAccounts[0];

  const profileItems = [
    { label: 'NIK', value: user?.nik ?? '-' },
    { label: 'Nama Bank', value: primaryBank?.bank_name ?? '-' },
    { label: 'Nama', value: user?.full_name ?? '-' },
    { label: 'Penghasilan (per tahun)', value: '-' },
    { label: 'Umur', value: user?.date_of_birth ? `${new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()} tahun` : '-' },
    { label: 'Status Domisili', value: user?.home_ownership ?? '-' },
    { label: 'Profesi', value: '-' },
    { label: 'Alamat', value: user?.address ?? '-' },
    { label: 'Lama Bekerja', value: '-' },
    { label: 'Nama Perusahaan', value: '-' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <GlassCircle size={50}>
              <Feather name="chevron-left" size={22} color={Colors.green} />
            </GlassCircle>
          </TouchableOpacity>
          <GlassCircle size={50}>
            <Feather name="user" size={20} color={Colors.white} />
          </GlassCircle>
          <Text style={styles.headerName}>{user?.full_name ?? 'User'}</Text>
        </View>

        {/* Rank badge */}
        <View style={styles.rankSection}>
          <View style={[styles.rankBadge, { backgroundColor: rankColors.bg, borderColor: rankColors.border }]}>
            <Text style={styles.rankEmoji}>{RANK_EMOJI_BIG[rankName] ?? '⚙️'}</Text>
          </View>
          <Text style={[styles.rankName, { color: rankColors.text }]}>{rankName}</Text>

          <View style={styles.xpRow}>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.min(xpProgress * 100, 100)}%`, backgroundColor: rankColors.text }]} />
            </View>
            <Text style={styles.xpLabel}>{xp}/{xpMax ?? '∞'}xp</Text>
          </View>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>Limit Bulan Ini</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: '40%', backgroundColor: rankColors.text }]} />
            </View>
          </View>
        </View>

        {/* Data pribadi */}
        <GlassCard radius={20} padding={20} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <GlassCircle size={36}>
              <Feather name="edit-2" size={15} color={Colors.green} />
            </GlassCircle>
            <Text style={styles.sectionTitle}>Data Pribadi</Text>
          </View>

          <View style={styles.grid}>
            {profileItems.map((item, i) => (
              <View key={i} style={styles.gridItem}>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridValue} numberOfLines={2}>{item.value}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Leaderboard shortcut */}
        <TouchableOpacity
          style={styles.leaderboardCard}
          onPress={() => router.push('/leaderboard')}
          activeOpacity={0.85}
        >
          <Feather name="award" size={20} color={Colors.green} />
          <Text style={styles.leaderboardText}>Lihat Leaderboard</Text>
          <Feather name="chevron-right" size={18} color={Colors.gray} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },

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
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },

  headerName: { color: Colors.white, fontSize: 22, fontWeight: '800', flex: 1, letterSpacing: -0.5 },
  rankSection: { alignItems: 'center', marginBottom: 32 },
  rankBadge: {
    width: 100, height: 100, borderRadius: 20, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    transform: [{ rotate: '10deg' }],
  },
  rankEmoji: { fontSize: 48, transform: [{ rotate: '-10deg' }] },
  rankName: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  xpBar: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' },
  xpFill: { height: 10, borderRadius: 999 },
  xpLabel: { color: Colors.text3, fontSize: 11, fontWeight: '600', width: 70, textAlign: 'right' },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingHorizontal: 20 },
  limitLabel: { color: Colors.text3, fontSize: 12, width: 110 },

  sectionCard: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { color: Colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 22 },
  gridItem: { width: '45%' },
  gridLabel: { color: Colors.white, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  gridValue: { color: Colors.text3, fontSize: 14 },

  leaderboardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.glass, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.glassBorder, marginBottom: 14,
  },
  leaderboardText: { flex: 1, color: Colors.white, fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.redHard, borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 8,
  },
  logoutText: { color: Colors.redHard, fontSize: 15, fontWeight: '600' },
});
