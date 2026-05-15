import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RankBadge } from "@/components/RankBadge";
import { RANK_XP, RANK_LIMIT, RANK_RATE } from "@/constants/config";
import { rankColors } from "@/constants/colors";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const RANK_ORDER = ["Ruby", "Diamond", "Platinum", "Gold", "Silver", "Bronze", "Iron"] as const;

function formatLimit(n: number) {
  if (n === 0) return "Terkunci";
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  return `Rp ${(n / 1_000).toFixed(0)}rb`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  currentRank: string;
  currentXp: number;
}

export function RankRoadmapSheet({ visible, onClose, currentRank, currentXp }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 220,
          mass: 0.8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const currentIndex = RANK_ORDER.indexOf(currentRank as any);

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="box-none"
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          opacity: backdropOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: SCREEN_HEIGHT,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: "#0c0f0b",
          overflow: "hidden",
          transform: [{ translateY }],
        }}
      >
        {/* Handle + Header */}
        <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 99, alignSelf: "center", marginBottom: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: "#e8ebe6" }}>Rank Roadmap</Text>
              <Text style={{ fontSize: 12, color: "#525550", marginTop: 2 }}>Tingkatkan XP untuk naik rank</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={18} color="#e8ebe6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {RANK_ORDER.map((rank, index) => {
            const isCurrent = rank === currentRank;
            const isAchieved = index > currentIndex;
            const isAbove = index < currentIndex;
            const [xpMin, xpMax] = RANK_XP[rank];
            const limit = RANK_LIMIT[rank];
            const rate = RANK_RATE[rank];
            const rc = rankColors[rank];
            const isLast = index === RANK_ORDER.length - 1;
            const isFirst = index === 0;

            const lineColor = isAchieved
              ? "rgba(255,255,255,0.08)"
              : isCurrent
              ? (rc?.badge ?? "#9fe870") + "80"
              : "rgba(255,255,255,0.04)";

            const dotColor = isCurrent
              ? rc?.badge ?? "#9fe870"
              : isAchieved
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.06)";

            return (
              <View key={rank} style={{ flexDirection: "row" }}>
                {/* Connector column */}
                <View style={{ width: 28, alignItems: "center" }}>
                  {/* Top line segment */}
                  <View style={{
                    width: 2,
                    height: isFirst ? 20 : 16,
                    backgroundColor: isFirst ? "transparent" : lineColor,
                  }} />
                  {/* Dot */}
                  <View style={{
                    width: isCurrent ? 14 : 8,
                    height: isCurrent ? 14 : 8,
                    borderRadius: 99,
                    backgroundColor: dotColor,
                    ...(isCurrent ? {
                      shadowColor: rc?.badge ?? "#9fe870",
                      shadowRadius: 8,
                      shadowOpacity: 0.9,
                      elevation: 6,
                    } : {}),
                  }} />
                  {/* Bottom line segment */}
                  {!isLast && (
                    <View style={{
                      width: 2,
                      flex: 1,
                      minHeight: 16,
                      backgroundColor: lineColor,
                    }} />
                  )}
                </View>

                {/* Rank card */}
                <View style={{ flex: 1, paddingLeft: 12, paddingTop: 10, paddingBottom: isLast ? 16 : 0, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                  <View style={{ paddingBottom: isLast ? 0 : 12, opacity: isAbove ? 0.4 : 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <RankBadge rank={rank} size={44} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <Text style={{
                            fontSize: 16,
                            fontFamily: "DMSans_700Bold",
                            color: "#e8ebe6",
                          }}>
                            {rank}
                          </Text>
                          {isCurrent && (
                            <View style={{
                              backgroundColor: rc?.badge ?? "#9fe870",
                              borderRadius: 999,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                            }}>
                              <Text style={{ fontSize: 9, fontFamily: "DMSans_700Bold", color: "#0e0f0c" }}>
                                KAMU DISINI
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: "#525550", fontFamily: "DMSans_400Regular" }}>
                          {xpMax === Infinity
                            ? `${xpMin.toLocaleString("id-ID")}+ XP`
                            : `${xpMin.toLocaleString("id-ID")} – ${xpMax.toLocaleString("id-ID")} XP`}
                        </Text>
                      </View>
                    </View>

                    <View style={{
                      marginTop: 10,
                      flexDirection: "row", gap: 20, alignItems: "center",
                    }}>
                      {rank === "Iron" ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Ionicons name="lock-closed" size={12} color="#f87171" />
                          <Text style={{ fontSize: 11, color: "#f87171", fontFamily: "DMSans_400Regular" }}>
                            Tidak dapat mengajukan pinjaman
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View>
                            <Text style={{ fontSize: 10, color: "#525550" }}>Limit Bulanan</Text>
                            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: isCurrent ? "#e8ebe6" : "#868685" }}>
                              {formatLimit(limit)}
                            </Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: "#525550" }}>Bunga</Text>
                            <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: isCurrent ? "#e8ebe6" : "#868685" }}>
                              {rate}% p.a.
                            </Text>
                          </View>
                          {isCurrent && xpMax !== Infinity && (
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                              <Text style={{ fontSize: 10, color: "#525550" }}>XP tersisa</Text>
                              <Text style={{ fontSize: 13, fontFamily: "DMSans_600SemiBold", color: rc?.badge ?? "#9fe870" }}>
                                {Math.max(0, xpMax + 1 - currentXp).toLocaleString("id-ID")} XP
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
