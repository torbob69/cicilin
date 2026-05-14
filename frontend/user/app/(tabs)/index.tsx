import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { loanAPI, questAPI, userAPI } from '../../services/api';
import { Colors } from '../../constants/colors';
import GlassCard from '../../components/GlassCard';
import {
  formatIDR, formatDateShort, LOAN_STATUS_LABEL,
  LOAN_STATUS_COLOR, LOAN_INTENT_MAP,
} from '../../constants/helpers';

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

export default function HomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loans, setLoans] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [rank, setRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [loansRes, questsRes, rankRes, meRes] = await Promise.all([
        loanAPI.list('all'),
        questAPI.getActive(),
        userAPI.getRank(),
        userAPI.getMe(),
      ]);
      setLoans(loansRes.data);
      setQuests(questsRes.data?.quests ?? []);
      setRank(rankRes.data);
      setUser(meRes.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const activeLoan = loans.find((l) => ['disbursed', 'approved'].includes(l.loan_status));
  const recentLoans = loans.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <GlassCircle size={50}>
            <Feather name="user" size={18} color={Colors.gray} />
          </GlassCircle>
          <View>
            <Text style={styles.hiText}>Hi, <Text style={styles.nameText}>{user?.full_name?.split(' ')[0] ?? 'User'}</Text></Text>
            {rank && (
              <View style={styles.rankChip}>
                <Text style={styles.rankChipText}>{rank.rank} · {rank.xp} XP</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/leaderboard')}
            style={styles.leaderboardBtn}
          >
            <Feather name="award" size={18} color={Colors.green} />
          </TouchableOpacity>
        </View>

        {/* Active loan card */}
        {activeLoan ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/loan-detail', params: { id: activeLoan.id } })}
            activeOpacity={0.9}
            style={styles.activeTouchable}
          >
            <GlassCard radius={28} padding={20} style={styles.activeCardStyle}>
              <Text style={styles.activeCardLabel}>Tagihan Aktif</Text>
              <Text style={styles.activeAmount}>{formatIDR(activeLoan.monthly_installment ?? activeLoan.loan_amnt)}</Text>
              <Text style={styles.activeDue}>
                {activeLoan.loan_status === 'disbursed' ? 'Cair — bayar cicilan sekarang' : 'Menunggu pencairan'}
              </Text>
              <TouchableOpacity
                style={styles.bayarBtn}
                onPress={() => router.push({ pathname: '/loan-detail', params: { id: activeLoan.id } })}
                activeOpacity={0.85}
              >
                <Text style={styles.bayarBtnText}>Bayar Sekarang</Text>
              </TouchableOpacity>

              {/* Limit bar */}
              {rank && (
                <View style={styles.limitSection}>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>Limit Bulan Ini</Text>
                    <Text style={styles.limitVal}>{formatIDR(rank.monthly_limit)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, {
                        width: `${Math.min((activeLoan.loan_amnt / rank.monthly_limit) * 100, 100)}%` as any,
                      }]}
                    />
                  </View>
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/apply')}
            activeOpacity={0.85}
            style={styles.noLoanTouchable}
          >
            <GlassCard radius={28} padding={24} style={styles.noLoanCardStyle}>
              <View style={styles.noLoanInner}>
                <Feather name="plus-circle" size={24} color={Colors.green} />
                <Text style={styles.noLoanTitle}>Belum ada pinjaman aktif</Text>
                <Text style={styles.noLoanSub}>Ajukan pinjaman sekarang</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Monthly quests */}
        {quests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Misi Bulanan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questScroll}>
              {quests.map((q: any, i: number) => (
                <TouchableOpacity
                  key={q.quest_id ?? i}
                  style={[styles.questCard, i % 2 === 0 ? styles.questCardOlive : styles.questCardPurple]}
                  onPress={() => router.push('/(tabs)/quests')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.questText} numberOfLines={2}>{q.title ?? q.description}</Text>
                  <View style={[styles.xpBadge, q.completed && styles.xpBadgeDone]}>
                    <Text style={styles.xpBadgeText}>{q.completed ? '✓ Selesai' : `+${q.xp_reward}xp`}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loan history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat</Text>
          {recentLoans.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat pinjaman</Text>
          ) : (
            recentLoans.map((loan: any) => {
              const isOverdue = loan.loan_status === 'disbursed' && loan.is_overdue;
              const isRejected = loan.loan_status === 'rejected';
              const amtColor = (isOverdue || isRejected) ? Colors.red : Colors.text2;
              const statusColor = LOAN_STATUS_COLOR[loan.loan_status] ?? Colors.gray;
              const statusLabel = LOAN_STATUS_LABEL[loan.loan_status] ?? loan.loan_status;

              return (
                <View key={loan.id} style={styles.loanRow}>
                  <View style={styles.loanInfo}>
                    <Text style={[styles.loanAmount, { color: amtColor }]}>
                      {formatIDR(loan.loan_amnt)}
                    </Text>
                    <Text style={[styles.loanStatus, { color: statusColor }]}>
                      {statusLabel}
                      {loan.created_at ? ` · ${formatDateShort(loan.created_at)}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => router.push({ pathname: '/loan-detail', params: { id: loan.id } })}
                    activeOpacity={0.8}
                  >
                    <GlassCircle size={50}>
                      <Feather name="search" size={16} color={Colors.gray} />
                    </GlassCircle>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          {loans.length > 5 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/status')} style={styles.seeMore}>
              <Text style={styles.seeMoreText}>lihat lebih lanjut →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
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
  hiText: { color: Colors.gray, fontSize: 16, fontWeight: '400' },
  nameText: { color: Colors.white, fontWeight: '700' },
  rankChip: {
    backgroundColor: Colors.greenGlow, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', marginTop: 2,
  },
  rankChipText: { color: Colors.green, fontSize: 11, fontWeight: '700' },
  leaderboardBtn: { marginLeft: 'auto', padding: 4 },

  activeTouchable: { marginBottom: 28 },
  activeCardStyle: { width: '100%' },
  activeCardLabel: { color: Colors.gray, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  activeAmount: {
    color: Colors.green, fontSize: 40, fontWeight: '800', letterSpacing: -1, marginBottom: 4,
  },
  activeDue: { color: Colors.gray, fontSize: 13, marginBottom: 16 },
  bayarBtn: {
    backgroundColor: Colors.greenGlass,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 30,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  bayarBtnText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  limitSection: { marginTop: 16 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  limitLabel: { color: Colors.gray, fontSize: 12 },
  limitVal: { color: Colors.gray, fontSize: 12 },
  progressTrack: {
    height: 7,
    backgroundColor: Colors.glass,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  progressFill: { height: 7, backgroundColor: Colors.white, borderRadius: 999 },

  noLoanTouchable: { marginBottom: 28 },
  noLoanCardStyle: { width: '100%' },
  noLoanInner: { alignItems: 'center', gap: 8 },
  noLoanTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  noLoanSub: { color: Colors.green, fontSize: 14 },

  section: { marginBottom: 28 },
  sectionTitle: { color: Colors.white, fontSize: 23, fontWeight: '800', letterSpacing: -1, marginBottom: 14 },

  questScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  questCard: {
    borderRadius: 28, padding: 14, width: 162, height: 110,
    marginRight: 12, justifyContent: 'space-between',
  },
  questCardOlive: { backgroundColor: Colors.olive },
  questCardPurple: { backgroundColor: Colors.purpleGlass },
  questText: { color: Colors.white, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  xpBadge: {
    backgroundColor: Colors.xpPill, borderRadius: 999, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: 'flex-start',
  },
  xpBadgeDone: { backgroundColor: 'rgba(34,197,94,0.3)' },
  xpBadgeText: { color: Colors.white, fontSize: 9, fontStyle: 'italic', fontWeight: '700' },

  loanRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 69, borderRadius: 100, backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  loanInfo: { flex: 1 },
  loanAmount: { fontSize: 26, fontWeight: '800', marginBottom: 3 },
  loanStatus: { fontSize: 11, fontWeight: '300' },
  searchBtn: {},
  emptyText: { color: Colors.gray, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  seeMore: { alignItems: 'center', paddingTop: 12 },
  seeMoreText: { color: Colors.green, fontSize: 14 },
});
