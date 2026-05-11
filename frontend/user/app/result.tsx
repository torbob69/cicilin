import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Colors, Fonts, Radius } from '../constants/theme';
import { api } from '../services/api';

const formatIDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const INTENT_LABEL: Record<string, string> = {
  PERSONAL: 'Personal Use',
  EDUCATION: 'Education',
  MEDICAL: 'Medical',
  VENTURE: 'Business',
  HOMEIMPROVEMENT: 'Home Improvement',
  DEBTCONSOLIDATION: 'Debt Consolidation',
};

type RingStatus = 'approved' | 'review' | 'rejected';

const STATUS_CONFIG: Record<RingStatus, { title: string; sub: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
  approved: { title: 'Congratulations!', sub: 'Your loan has been approved.', color: Colors.approve, icon: 'check-circle' },
  review: { title: 'Under Review', sub: 'A specialist will contact you shortly.', color: Colors.amber, icon: 'clock' },
  rejected: { title: 'Not Approved', sub: 'Unfortunately we cannot approve this application.', color: Colors.reject, icon: 'x-circle' },
};

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const [accepting, setAccepting] = useState(false);

  const loan = resultStr ? (() => { try { return JSON.parse(resultStr); } catch { return null; } })() : null;

  if (!loan) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>No result data found.</Text>
        <Button label="Go Home" onPress={() => router.replace('/(tabs)')} variant="ghost" />
      </View>
    );
  }

  const score = Math.round((loan.confidence ?? 0) * 100);
  const ringStatus: RingStatus =
    loan.loan_status === 'approved' ? 'approved'
    : loan.loan_status === 'rejected' ? 'rejected'
    : 'review';

  const config = STATUS_CONFIG[ringStatus];

  const monthlyPayment =
    loan.loan_amnt && loan.tenure_months && loan.loan_int_rate
      ? Math.ceil(loan.loan_amnt * (1 + loan.loan_int_rate / 100) / loan.tenure_months)
      : loan.loan_amnt && loan.tenure_months
      ? Math.ceil(loan.loan_amnt / loan.tenure_months)
      : null;

  const details: { label: string; value: string }[] = [
    { label: 'Loan Amount', value: formatIDR(loan.loan_amnt) },
    { label: 'Purpose', value: INTENT_LABEL[loan.loan_intent] ?? loan.loan_intent },
    { label: 'Tenure', value: `${loan.tenure_months} months` },
    loan.loan_grade && { label: 'Loan Grade', value: `Grade ${loan.loan_grade}` },
    loan.loan_int_rate != null && { label: 'Interest Rate', value: `${Number(loan.loan_int_rate).toFixed(2)}% p.a.` },
    monthlyPayment && { label: 'Est. Monthly Payment', value: formatIDR(monthlyPayment) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Close */}
      <View style={styles.closeRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.closeBtn}>
          <Feather name="x" size={18} color={Colors.ink700} />
        </TouchableOpacity>
      </View>

      {/* Score ring */}
      <View style={styles.scoreSection}>
        <ScoreRing score={score} status={ringStatus} size={164} />
        <View style={[styles.statusIconWrap, { backgroundColor: `${config.color}1A` }]}>
          <Feather name={config.icon} size={18} color={config.color} />
        </View>
        <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
        <Text style={styles.statusSub}>{config.sub}</Text>
      </View>

      {/* Loan details */}
      <GlassCard padding={0} style={{ marginBottom: 12, borderColor: `${config.color}33`, borderWidth: 1 }}>
        {details.map((row, idx) => (
          <View key={row.label} style={[styles.detailRow, idx === details.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>{row.label}</Text>
            <Text style={styles.detailValue}>{row.value}</Text>
          </View>
        ))}
      </GlassCard>

      {/* Confidence bar */}
      <GlassCard padding={18} style={{ marginBottom: 28 }}>
        <Text style={styles.confLabel}>AI Confidence Score</Text>
        <View style={styles.confRow}>
          <View style={styles.confBar}>
            <View style={[styles.confFill, { width: `${score}%` as any, backgroundColor: config.color }]} />
          </View>
          <Text style={[styles.confScore, { color: config.color }]}>{score}%</Text>
        </View>
        <Text style={styles.confNote}>
          {score >= 90 ? 'Excellent — strong credit profile'
           : score >= 70 ? 'Good — solid credit profile'
           : score >= 50 ? 'Fair — moderate risk profile'
           : 'Needs improvement — higher risk'}
        </Text>
      </GlassCard>

      {/* Actions */}
      {ringStatus === 'approved' ? (
        <>
          <Button
            label="Accept Offer"
            loading={accepting}
            onPress={async () => {
              setAccepting(true);
              try {
                await api.post(`/loans/${loan.id}/accept-offer`, {});
                Alert.alert(
                  'Offer Accepted!',
                  'Your loan has been disbursed. Check the Status tab for your repayment schedule.',
                  [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
                );
              } catch (e: any) {
                Alert.alert('Error', e.response?.data?.detail ?? 'Could not accept offer. Please try again.');
              } finally {
                setAccepting(false);
              }
            }}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            label="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="ghost"
            size="lg"
            fullWidth
            style={{ marginTop: 10 }}
          />
        </>
      ) : (
        <Button
          label="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          variant="ghost"
          size="lg"
          fullWidth
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black },
  content: { paddingHorizontal: 20 },
  errorScreen: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500 },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  scoreSection: { alignItems: 'center', paddingVertical: 28 },
  statusIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 8 },
  statusTitle: { fontFamily: Fonts.display, fontSize: 26, textAlign: 'center' },
  statusSub: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500, textAlign: 'center', marginTop: 6 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500 },
  detailValue: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.ink900 },
  confLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  confBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.ink100, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 3 },
  confScore: { fontFamily: Fonts.display, fontSize: 20, width: 50, textAlign: 'right' },
  confNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink500 },
});
