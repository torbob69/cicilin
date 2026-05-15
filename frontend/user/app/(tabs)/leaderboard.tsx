import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";
import { questService } from "@/services/quests";
import { RankBadge } from "@/components/RankBadge";
import { RankRoadmapSheet } from "@/components/RankRoadmapSheet";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { rankColors } from "@/constants/colors";

interface LeaderboardEntry {
  rank_position: number;
  user_id: number;
  full_name: string;
  xp: number;
  rank: string;
}


function LeaderboardRow({ entry, isMe, isLast }: { entry: LeaderboardEntry; isMe: boolean; isLast: boolean }) {
  return (
    <View
      style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }}
      className={`p-lg flex-row items-center ${isMe ? "bg-primary/10" : ""}`}
    >
      <Text style={{ width: 32, fontSize: 32, fontFamily: "DMSans_700Bold", color: entry.rank_position <= 3 ? "#e8ebe6" : "#525550" }}>
        {`${entry.rank_position}`}
      </Text>

      <View className="mr-md">
        <RankBadge rank={entry.rank} size={28} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-sans-semibold text-ink" numberOfLines={1}>
          {entry.full_name}{isMe ? " (kamu)" : ""}
        </Text>
        <Text className="text-xs text-mute">{entry.rank}</Text>
      </View>

      <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: isMe ? "#e8ebe6" : "#e8ebe6" }}>
        {entry.xp.toLocaleString("id-ID")} XP
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const load = async () => {
    try { const res = await questService.getLeaderboard(50); setEntries(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const myEntry = entries.find((e) => e.user_id === user?.id);

  return (
    <View style={{ flex: 1, backgroundColor: "#0c0f0b" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* Header */}
        <View className="px-xl pb-sm">
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View>
              <Text className="text-2xl font-sans-black text-ink">Rank</Text>
              <Text className="text-sm text-mute">Top peminjam bulan ini</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowRoadmap(true)}
              style={{
                marginTop: 4,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color="#868685" />
            </TouchableOpacity>
          </View>
        </View>

        {/* My position card */}
        {myEntry && (
          <View
            className="mx-xl mt-lg mb-lg rounded-xl px-lg py-md flex-row items-center gap-md"
            style={{ backgroundColor: rankColors[myEntry.rank]?.bg ?? "#1e211d" }}
          >
            <RankBadge rank={myEntry.rank} size={40} />
            <View className="flex-1">
              <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870", fontSize: 11, opacity: 0.7 }}>Posisimu</Text>
              <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870", fontSize: 18, fontFamily: "DMSans_700Bold" }}>
                #{myEntry.rank_position}
              </Text>
            </View>
            <Text style={{ color: rankColors[myEntry.rank]?.text ?? "#9fe870", fontSize: 16, fontFamily: "DMSans_700Bold" }}>
              {myEntry.xp.toLocaleString("id-ID")} XP
            </Text>
          </View>
        )}

        {/* List */}
        <View className="px-xl mt-xs">
          {loading && !refreshing ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </View>
          ) : entries.length === 0 ? (
            <View className="mt-sm rounded-xl p-xl">
              <Text className="text-sm text-mute text-center">Belum ada data</Text>
            </View>
          ) : (
            entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                isMe={entry.user_id === user?.id}
                isLast={i === entries.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>

      <RankRoadmapSheet
        visible={showRoadmap}
        onClose={() => setShowRoadmap(false)}
        currentRank={user?.rank ?? "Gold"}
        currentXp={user?.xp ?? 0}
      />
    </View>
  );
}
