import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { api } from '../../services/api';

const formatIDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approved', color: Colors.approve, bg: Colors.mintDim },
  rejected: { label: 'Rejected', color: Colors.reject, bg: Colors.coralDim },
  manual_review: { label: 'Under Review', color: Colors.amber, bg: Colors.amberDim },
  pending: { label: 'Pending', color: Colors.amber, bg: Colors.amberDim },
};

const FILTERS = ['all', 'approved', 'manual_review', 'rejected'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  approved: 'Approved',
  manual_review: 'Under Review',
  rejected: 'Rejected',
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [loans, setLoans] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans/');
      setLoans(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  const filtered = filter === 'all' ? loans : loans.filter(l => l.loan_status === filter);

  const renderItem = ({ item }: { item: any }) => {
    const meta = STATUS_META[item.loan_status] ?? { label: item.loan_status, color: Colors.ink500, bg: Colors.surface };
    const score = item.confidence != null ? Math.round(item.confidence * 100) : null;
    return (
      <GlassCard padding={18}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardAmount}>{formatIDR(item.loan_amnt)}</Text>
            <Text style={styles.cardMeta}>
              {item.loan_intent?.replace(/_/g, ' ')} · {item.tenure_months} months
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {score != null && (
              <Text style={[styles.scoreNum, { color: meta.color }]}>{score}%</Text>
            )}
          </View>
        </View>
        {item.loan_grade && (
          <View style={styles.gradeRow}>
            <View style={styles.gradePill}>
              <Text style={styles.gradeText}>Grade {item.loan_grade}</Text>
            </View>
            {item.loan_int_rate != null && (
              <Text style={styles.rateText}>{Number(item.loan_int_rate).toFixed(1)}% p.a.</Text>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Loan History</Text>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={{ marginBottom: 16, flexGrow: 0 }}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.mint} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={40} color={Colors.ink400} />
          <Text style={styles.emptyText}>No loans found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchLoans(); }}
              tintColor={Colors.mint}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.ink900, paddingHorizontal: 20, marginBottom: 16 },
  filterList: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.mintDim, borderColor: Colors.mint },
  filterLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500 },
  filterLabelActive: { color: Colors.mint },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardAmount: { fontFamily: Fonts.display, fontSize: 20, color: Colors.ink900 },
  cardMeta: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink500, marginTop: 4, textTransform: 'capitalize' },
  cardDate: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink400, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontFamily: Fonts.bodyMedium, fontSize: 11 },
  scoreNum: { fontFamily: Fonts.display, fontSize: 18 },
  gradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  gradePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  gradeText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink700 },
  rateText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink500 },
});
