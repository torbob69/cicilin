import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { loanAPI } from '../../services/api';
import { Colors } from '../../constants/colors';
import { formatIDR, formatDateShort, LOAN_STATUS_LABEL, LOAN_STATUS_COLOR } from '../../constants/helpers';

const TABS = [
  { label: 'Semua', value: 'all' },
  { label: 'Diterima', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Lunas', value: 'closed' },
  { label: 'Menunggak', value: 'unpaid' },
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

export default function StatusScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = useCallback(async (tab: string) => {
    try {
      const res = await loanAPI.list(tab);
      setLoans(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLoans(activeTab);
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLoans(activeTab);
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <GlassCircle size={50}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </GlassCircle>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Riwayat</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabScrollWrapper}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tab, activeTab === t.value && styles.tabActive]}
            onPress={() => setActiveTab(t.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === t.value && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
          showsVerticalScrollIndicator={false}
        >
          {loans.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Tidak ada data</Text>
            </View>
          ) : (
            loans.map((loan: any) => {
              const isOverdue = loan.loan_status === 'unpaid' || (loan.loan_status === 'disbursed' && loan.is_overdue);
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 12 },

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

  title: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  userName: { color: Colors.gray, fontSize: 12, marginTop: 1 },
  tabScrollWrapper: { flexGrow: 0 },
  tabScroll: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  tab: {
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
  },
  tabActive: { backgroundColor: Colors.green },
  tabText: { color: Colors.grayLight, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  loanRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 69, borderRadius: 100, backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  loanInfo: { flex: 1 },
  loanAmount: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  loanStatus: { fontSize: 11, fontWeight: '300' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.gray, fontSize: 15 },
});
