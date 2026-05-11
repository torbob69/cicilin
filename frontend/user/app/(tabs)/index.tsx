import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { api } from '../../services/api';

const formatIDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approved', color: Colors.approve, bg: Colors.mintDim },
  rejected: { label: 'Rejected', color: Colors.reject, bg: Colors.coralDim },
  manual_review: { label: 'Under Review', color: Colors.amber, bg: Colors.amberDim },
  pending: { label: 'Pending', color: Colors.amber, bg: Colors.amberDim },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, loansRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/loans/'),
      ]);
      setUser(userRes.data);
      setLoans(loansRes.data.slice(0, 3));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const latestLoan = loans[0];

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.mint} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={Colors.mint}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0] ?? 'there'}</Text>
            <Text style={styles.subGreeting}>Ready to make a move?</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarInitial}>
              {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Latest loan card */}
        {latestLoan ? (
          <GlassCard padding={20} style={{ marginBottom: 16 }}>
            <View style={styles.loanCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.loanCardLabel}>Latest Loan</Text>
                <Text style={styles.loanAmount}>{formatIDR(latestLoan.loan_amnt)}</Text>
                <Text style={styles.loanMeta}>
                  {latestLoan.tenure_months}mo · {latestLoan.loan_intent?.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_META[latestLoan.loan_status]?.bg ?? Colors.ink100 }]}>
                <Text style={[styles.statusText, { color: STATUS_META[latestLoan.loan_status]?.color ?? Colors.ink500 }]}>
                  {STATUS_META[latestLoan.loan_status]?.label ?? latestLoan.loan_status}
                </Text>
              </View>
            </View>
            {latestLoan.confidence != null && (
              <View style={styles.scoreRow}>
                <View style={styles.scoreBar}>
                  <View style={[
                    styles.scoreBarFill,
                    {
                      width: `${Math.round(latestLoan.confidence * 100)}%` as any,
                      backgroundColor: STATUS_META[latestLoan.loan_status]?.color ?? Colors.mint,
                    },
                  ]} />
                </View>
                <Text style={[styles.scoreText, { color: STATUS_META[latestLoan.loan_status]?.color ?? Colors.mint }]}>
                  {Math.round(latestLoan.confidence * 100)}%
                </Text>
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard padding={32} style={{ marginBottom: 16 }}>
            <View style={styles.emptyCard}>
              <Feather name="credit-card" size={36} color={Colors.ink400} />
              <Text style={styles.emptyTitle}>No loans yet</Text>
              <Text style={styles.emptyBody}>Apply for your first loan below</Text>
            </View>
          </GlassCard>
        )}

        {/* Apply CTA */}
        <TouchableOpacity
          style={[styles.applyBtn, Shadow.card]}
          onPress={() => router.push('/apply')}
          activeOpacity={0.85}
        >
          <View style={styles.applyBtnInner}>
            <View>
              <Text style={styles.applyBtnTitle}>Apply for a Loan</Text>
              <Text style={styles.applyBtnSub}>Get an instant AI decision</Text>
            </View>
            <View style={styles.applyArrow}>
              <Feather name="arrow-right" size={18} color={Colors.black} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick access */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickRow}>
          {[
            { icon: 'clock' as const, label: 'History', onPress: () => router.push('/(tabs)/history') },
            { icon: 'file-text' as const, label: 'Documents', onPress: () => router.push('/(tabs)/profile') },
            { icon: 'help-circle' as const, label: 'Support', onPress: () => {} },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={{ flex: 1 }} onPress={item.onPress} activeOpacity={0.7}>
              <GlassCard padding={16}>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Feather name={item.icon} size={22} color={Colors.mint} />
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black },
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  greeting: { fontFamily: Fonts.display, fontSize: 26, color: Colors.ink900 },
  subGreeting: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500, marginTop: 4 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.mintDim,
    borderWidth: 1.5, borderColor: Colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: Fonts.display, fontSize: 18, color: Colors.mint },
  loanCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanCardLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  loanAmount: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink900 },
  loanMeta: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink500, marginTop: 4, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  statusText: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  scoreBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.ink100, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreText: { fontFamily: Fonts.displayMedium, fontSize: 12, width: 36, textAlign: 'right' },
  emptyCard: { alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.ink700 },
  emptyBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink500 },
  applyBtn: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.mint,
    marginBottom: 28,
  },
  applyBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  applyBtnTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.black },
  applyBtnSub: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(0,0,0,0.55)', marginTop: 2 },
  applyArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.ink700 },
});
