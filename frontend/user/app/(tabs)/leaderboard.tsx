import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { questService } from "@/services/quests";
import { RankBadge } from "@/components/RankBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { rankColors } from "@/constants/colors";

interface LeaderboardEntry {
  rank_position: number;
  user_id: number;
  full_name: string;
  xp: number;
  rank: string;
}



export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const res = await questService.getLeaderboard(50); setEntries(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const myEntry = entries.find((e) => e.user_id === user?.id);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.user_id === user?.id;
    const isPodium = item.rank_position <= 3;

    return (
      <View
        className={`flex-row items-center px-xl py-md mx-xl mb-xs rounded-xl ${isMe ? "bg-primary/15 border border-primary" :
            isPodium ? "bg-canvas" : "bg-canvas/60"
          }`}
      >
        <View className="w-8 items-center">
          <Text className={`text-sm font-sans-bold ${isPodium ? "text-primary" : "text-mute"}`}>
            #{item.rank_position}
          </Text>
        </View>

        <View className="ml-sm mr-md">
          <RankBadge rank={item.rank} size={32} />
        </View>

        <View className="flex-1">
          <Text className={`text-sm font-sans-semibold ${isMe ? "text-ink" : "text-ink"}`}>
            {item.full_name}{isMe ? " · Kamu" : ""}
          </Text>
          <Text className="text-xs text-mute">{item.rank}</Text>
        </View>

        <Text className={`text-sm font-sans-bold ${isMe ? "text-ink" : "text-body"}`}>
          {item.xp.toLocaleString("id-ID")} XP
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-canvas-soft">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 20 }} className="px-xl pb-lg">
        <Text className="text-2xl font-sans-black text-ink">Leaderboard</Text>
        <Text className="text-sm text-mute">Top peminjam berdasarkan XP</Text>
      </View>

      {/* My position sticky card */}
      {myEntry && (
        <View
          className="mx-xl mb-lg rounded-2xl px-xl py-lg flex-row items-center gap-md shadow-sm"
          style={{ backgroundColor: rankColors[myEntry.rank]?.bg ?? "#1e211d" }}
        >
          <RankBadge rank={myEntry.rank} size={48} />
          <View className="flex-1">
            <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870", opacity: 0.8 }} className="text-xs uppercase tracking-wider font-sans-semibold">Posisimu</Text>
            <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870" }} className="text-xl font-sans-black">#{myEntry.rank_position}</Text>
          </View>
          <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870" }} className="text-xl font-sans-black">{myEntry.xp.toLocaleString("id-ID")} XP</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View className="px-xl gap-sm">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => String(e.user_id)}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="py-3xl items-center">
              <Text className="text-mute">Belum ada data</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
