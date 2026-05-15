import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { questService } from "@/services/quests";
import { SkeletonCard } from "@/components/ui/Skeleton";

interface Quest {
  quest_id: number;
  title: string;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
}

function QuestRow({ quest, isLast }: { quest: Quest; isLast: boolean }) {
  return (
    <View
      style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }}
      className="p-lg flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text style={{
          fontSize: 11,
          fontFamily: "DMSans_600SemiBold",
          color: quest.completed ? "#4ade80" : "#9fe870",
          opacity: quest.completed ? 0.5 : 1,
          marginBottom: 2,
        }}>
          +{quest.xp_reward} XP
        </Text>
        <Text
          className="text-sm font-sans-semibold text-ink leading-5"
          style={{ opacity: quest.completed ? 0.5 : 1 }}
        >
          {quest.title}
        </Text>
        {quest.completed_at ? (
          <Text style={{ color: "#4ade80", fontSize: 11, marginTop: 2 }}>
            Selesai {new Date(quest.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </Text>
        ) : (
          <Text className="text-xs text-mute" style={{ marginTop: 2 }}>Belum selesai</Text>
        )}
      </View>
    </View>
  );
}

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await questService.getActive();
      setQuests(res.data.quests ?? []);
      setMonth(`${res.data.year}-${String(res.data.month).padStart(2, "0")}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const completed = quests.filter((q) => q.completed).length;
  const total = quests.length;
  const pct = total ? completed / total : 0;

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* Header */}
        <View className="px-xl pb-sm">
          <Text className="text-2xl font-sans-black text-ink">Quest Bulanan</Text>
          {month && (
            <Text className="text-sm text-mute">
              {new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </Text>
          )}
        </View>

        {/* Progress bar */}
        {!loading && total > 0 && (
          <View className="px-xl mt-lg mb-lg">
            <View className="flex-row justify-between items-center mb-xs">
              <Text className="text-xs text-mute">{completed} dari {total} selesai</Text>
              <Text className="text-xs font-sans-semibold text-primary">{Math.round(pct * 100)}%</Text>
            </View>
            <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <View style={{ width: `${Math.max(pct * 100, total ? 2 : 0)}%`, height: "100%", backgroundColor: "#9fe870", borderRadius: 99 }} />
            </View>
          </View>
        )}

        {/* Quest list */}
        <View className="px-xl mt-xs">
          {loading ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </View>
          ) : quests.length === 0 ? (
            <View className="mt-sm rounded-xl p-xl">
              <Text className="text-sm text-mute text-center">Belum ada quest bulan ini</Text>
            </View>
          ) : (
            quests.map((quest, i) => (
              <QuestRow key={quest.quest_id} quest={quest} isLast={i === quests.length - 1} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
