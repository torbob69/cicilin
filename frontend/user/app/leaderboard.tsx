import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { leaderboardAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Colors, RankColors } from '../constants/colors';

const RANK_SHIELDS: Record<string, string> = {
  Ruby: '🔴', Diamond: '🔵', Platinum: '💙', Gold: '🟡', Silver: '⚪', Bronze: '🟠', Iron: '⚫',
};

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

function getNameColor(rankName: string, isMe: boolean): string {
  if (isMe) return Colors.green;
  if (rankName === 'Gold' || rankName === 'Ruby' || rankName === 'Diamond') return Colors.gold;
  if (rankName === 'Bronze') return 'rgb(240,126,0)';
  return Colors.white;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.get()
      .then((res) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const period = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

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
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.period}>periode {period}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.green} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item, i) => String(item.user_id ?? i)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isMe = item.user_id === user?.id;
            const rankColors = RankColors[item.rank] ?? RankColors.Iron;
            const nameColor = getNameColor(item.rank, isMe);
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                {/* Rank number */}
                <Text style={[styles.rankNum, index < 3 && styles.rankNumTop]}>
                  {index + 1}
                </Text>

                {/* Arrow */}
                <Feather name="chevrons-up" size={14} color={Colors.green} />

                {/* Avatar */}
                <View style={styles.avatar}>
                  <Feather name="user" size={16} color={Colors.gray} />
                </View>

                {/* Name */}
                <Text style={[styles.name, { color: nameColor }]} numberOfLines={1}>
                  {item.full_name ?? 'User'}
                </Text>

                {/* XP */}
                <Text style={styles.xp}>{item.xp} xp</Text>

                {/* Rank shield */}
                <Text style={styles.shield}>{RANK_SHIELDS[item.rank] ?? '⚫'}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Belum ada data leaderboard</Text>
            </View>
          }
        />
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

  title: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  period: { color: Colors.gray, fontSize: 12, marginTop: 2 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(24,24,24,0.8)',
    paddingHorizontal: 18,
  },
  rowMe: {
    borderWidth: 1.5,
    borderColor: 'rgba(167,167,167,0.35)',
  },
  rankNum: {
    color: Colors.gray,
    fontSize: 24,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  rankNumTop: { color: Colors.white },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  xp: { color: Colors.gray, fontSize: 13, fontWeight: '600' },
  shield: { fontSize: 18 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.gray, fontSize: 15 },
});
