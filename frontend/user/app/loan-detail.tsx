import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loanAPI } from '../services/api';
import { Colors } from '../constants/colors';
import {
  formatIDR, formatDate, LOAN_INTENT_MAP, LOAN_STATUS_LABEL, LOAN_STATUS_COLOR,
} from '../constants/helpers';

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<any>(null);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [loanRes, repRes] = await Promise.all([
        loanAPI.get(Number(id)),
        loanAPI.listRepayments(Number(id)),
      ]);
      setLoan(loanRes.data);
      setRepayments(repRes.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  async function handlePay(repaymentId: number) {
    Alert.alert('Bayar Cicilan', 'Konfirmasi pembayaran cicilan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Bayar', onPress: async () => {
          setPayingId(repaymentId);
          try {
            const res = await loanAPI.pay(Number(id), repaymentId);
            const { xp_gained, new_rank } = res.data;
            Alert.alert('Pembayaran Berhasil! 🎉', `+${xp_gained} XP\nRank: ${new_rank}`);
            fetchData();
          } catch (e: any) {
            Alert.alert('Gagal', e?.response?.data?.detail ?? 'Pembayaran gagal.');
          } finally {
            setPayingId(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Data tidak ditemukan</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.green, marginTop: 10 }}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = LOAN_STATUS_COLOR[loan.loan_status] ?? Colors.gray;
  const statusLabel = LOAN_STATUS_LABEL[loan.loan_status] ?? loan.loan_status;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Pinjaman</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Amount */}
        <Text style={styles.amount}>{formatIDR(loan.loan_amnt)}</Text>
        <Text style={styles.subLabel}>{loan.tenure_months} bulan · Cicilan {formatIDR(loan.monthly_installment ?? 0)}/bulan</Text>

        {/* Details card */}
        <View style={styles.detailCard}>
          {[
            { label: 'Tujuan', value: LOAN_INTENT_MAP[loan.loan_intent] ?? loan.loan_intent },
            { label: 'Grade', value: loan.loan_grade },
            { label: 'Bunga', value: `${loan.loan_int_rate}% p.a.` },
            { label: 'Tenor', value: `${loan.tenure_months} bulan` },
            { label: 'Persen penghasilan', value: `${(loan.loan_percent_income * 100).toFixed(1)}%` },
            { label: 'Diajukan', value: formatDate(loan.created_at) },
            { label: 'Dicairkan', value: loan.disbursed_at ? formatDate(loan.disbursed_at) : '-' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}

          {loan.confidence !== null && loan.confidence !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ML Score</Text>
              <Text style={[styles.detailValue, { color: loan.confidence >= 0.75 ? Colors.green : Colors.orange }]}>
                {(loan.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Repayments */}
        {repayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jadwal Cicilan</Text>
            {repayments.map((rep: any) => {
              const isPaid = rep.status === 'paid';
              const isLate = rep.status === 'overdue';
              const canPay = ['unpaid', 'overdue'].includes(rep.status) && loan.loan_status === 'disbursed';

              return (
                <View key={rep.id} style={styles.repRow}>
                  <View style={styles.repLeft}>
                    <Text style={styles.repNum}>Cicilan #{rep.installment_number}</Text>
                    <Text style={styles.repDate}>Jatuh tempo: {formatDate(rep.due_date)}</Text>
                    <Text style={[styles.repStatus, { color: isPaid ? Colors.green : isLate ? Colors.red : Colors.gray }]}>
                      {isPaid ? '✓ Lunas' : isLate ? '⚠ Telat' : 'Belum bayar'}
                    </Text>
                  </View>
                  <View style={styles.repRight}>
                    <Text style={styles.repAmount}>{formatIDR(rep.amount)}</Text>
                    {rep.penalty > 0 && (
                      <Text style={styles.repPenalty}>+{formatIDR(rep.penalty)} denda</Text>
                    )}
                    {canPay && (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => handlePay(rep.id)}
                        disabled={payingId === rep.id}
                        activeOpacity={0.85}
                      >
                        {payingId === rep.id
                          ? <ActivityIndicator color="#000" size="small" />
                          : <Text style={styles.payBtnText}>Bayar</Text>
                        }
                      </TouchableOpacity>
                    )}
                    {isPaid && rep.paid_at && (
                      <Text style={styles.paidDate}>Dibayar {formatDate(rep.paid_at)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  amount: { color: Colors.white, fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subLabel: { color: Colors.gray, fontSize: 13, marginBottom: 24 },
  detailCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { color: Colors.gray, fontSize: 13 },
  detailValue: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { color: Colors.white, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  repRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  repLeft: { flex: 1 },
  repNum: { color: Colors.white, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  repDate: { color: Colors.gray, fontSize: 12, marginBottom: 3 },
  repStatus: { fontSize: 12, fontWeight: '600' },
  repRight: { alignItems: 'flex-end', gap: 4 },
  repAmount: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  repPenalty: { color: Colors.red, fontSize: 11 },
  payBtn: {
    backgroundColor: Colors.green, borderRadius: 999, paddingHorizontal: 14,
    paddingVertical: 6, marginTop: 4, minWidth: 60, alignItems: 'center',
  },
  payBtnText: { color: '#000', fontSize: 12, fontWeight: '700' },
  paidDate: { color: Colors.green, fontSize: 11 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.gray, fontSize: 15 },
});
