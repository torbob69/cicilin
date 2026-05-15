import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { questService } from "@/services/quests";
import { SkeletonCard } from "@/components/ui/Skeleton";

interface Quest {
  quest_id: number;
  title: string;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
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
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* Header */}
        <View className="px-xl mb-lg">
          <Text className="text-2xl font-sans-black text-ink">Quest Bulanan</Text>
          {month && (
            <Text className="text-sm text-mute">
              {new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </Text>
          )}
        </View>

        {/* Progress card */}
        {!loading && (
          <View className="mx-xl bg-surface border border-primary/20 rounded-xl p-xl mb-lg">
            <Text className="text-xs text-primary/60 uppercase tracking-wider mb-sm">Progress bulan ini</Text>
            <View className="flex-row items-end gap-sm mb-lg">
              <Text className="text-5xl font-sans-black text-primary leading-none">{completed}</Text>
              <Text className="text-2xl font-sans-black text-primary/40 leading-none mb-1">/ {total}</Text>
              <Text className="text-sm text-primary/50 mb-1 ml-xs">selesai</Text>
            </View>
            <View className="h-2 bg-white/10 rounded-pill overflow-hidden">
              <View
                style={{ width: `${Math.max(pct * 100, total ? 4 : 0)}%` }}
                className="h-full bg-primary rounded-pill"
              />
            </View>
          </View>
        )}

        {/* Quest list */}
        <View className="px-xl gap-sm">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            quests.map((quest) => (
              <View
                key={quest.quest_id}
                className={`rounded-xl p-lg flex-row items-start gap-md ${quest.completed ? "bg-primary-pale" : "bg-canvas"
                  }`}
              >
                {/* Checkbox */}
                <View className={`w-6 h-6 rounded-md items-center justify-center flex-shrink-0 mt-xxs ${quest.completed ? "bg-positive" : "border-2 border-ink/20"
                  }`}>
                  {quest.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>

                <View className="flex-1">
                  <Text className={`text-sm font-sans-semibold leading-5 ${quest.completed ? "text-positive-deep" : "text-ink"
                    }`}>
                    {quest.title}
                  </Text>
                  {quest.completed_at && (
                    <Text className="text-xs text-positive mt-xxs">
                      Selesai {new Date(quest.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </Text>
                  )}
                </View>

                {/* XP badge */}
                <View className={`rounded-pill px-sm py-xxs flex-shrink-0 ${quest.completed ? "bg-positive/20" : "bg-primary"
                  }`}>
                  <Text className={`text-xs font-sans-bold ${quest.completed ? "text-positive-deep" : "text-on-primary"
                    }`}>
                    +{quest.xp_reward} XP
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
