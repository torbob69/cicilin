import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function QuestsScreen() {
  const [quests, setQuests] = useState<any[]>([]);
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const res = await questAPI.getActive();
      setQuests(res.data?.quests ?? res.data ?? []);
      const now = new Date();
      setMonth(now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchQuests(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchQuests(); }, [fetchQuests]);

  const completedCount = quests.filter((q) => q.completed).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} />
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
          <Text style={styles.title}>Misi Bulanan</Text>
          <Text style={styles.subtitle}>Selesaikan misi untuk dapat XP!</Text>
          <View style={styles.periodChip}>
            <Text style={styles.periodText}>{month}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressVal}>{completedCount}/{quests.length} selesai</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${quests.length ? (completedCount / quests.length) * 100 : 0}%` }]} />
          </View>
        </View>

        {/* Quest list */}
        {quests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>Belum ada misi bulan ini</Text>
          </View>
        ) : (
          quests.map((quest: any, i: number) => (
            <View key={quest.quest_id ?? i} style={[styles.questCard, quest.completed && styles.questCardDone]}>
              <View style={styles.questLeft}>
                <View style={[styles.questNumber, quest.completed && styles.questNumberDone]}>
                  {quest.completed
                    ? <Feather name="check" size={14} color={Colors.green} />
                    : <Text style={styles.questNumberText}>{i + 1}</Text>
                  }
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, quest.completed && styles.questTitleDone]}>
                    {quest.title ?? quest.description}
                  </Text>
                  {quest.completed && quest.completed_at && (
                    <Text style={styles.completedDate}>
                      Selesai {new Date(quest.completed_at).toLocaleDateString('id-ID')}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[styles.xpBadge, quest.completed && styles.xpBadgeDone]}>
                <Text style={styles.xpText}>+{quest.xp_reward}xp</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 20, paddingBottom: 110 },
  header: { marginBottom: 24 },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 12 },
  periodChip: {
    backgroundColor: Colors.greenGlow, borderWidth: 1, borderColor: Colors.greenBorder,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  periodText: { color: Colors.green, fontSize: 13, fontWeight: '600' },
  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: Colors.gray, fontSize: 13, fontWeight: '600' },
  progressVal: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.green, borderRadius: 3 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.gray, fontSize: 15 },
  questCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  questCardDone: { borderColor: Colors.greenBorder, backgroundColor: 'rgba(34,197,94,0.05)' },
  questLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, paddingRight: 8 },
  questNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  questNumberDone: { backgroundColor: Colors.greenGlow },
  questNumberText: { color: Colors.gray, fontSize: 12, fontWeight: '700' },
  questContent: { flex: 1 },
  questTitle: { color: Colors.white, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  questTitleDone: { color: Colors.grayLight },
  completedDate: { color: Colors.green, fontSize: 11, marginTop: 3 },
  xpBadge: {
    backgroundColor: Colors.greenGlow, borderRadius: 999, paddingHorizontal: 10,
    paddingVertical: 4, flexShrink: 0,
  },
  xpBadgeDone: { backgroundColor: 'rgba(34,197,94,0.25)' },
  xpText: { color: Colors.green, fontSize: 12, fontWeight: '700' },
});
