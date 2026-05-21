import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { useLoansStore, Repayment } from "@/store/loans";
import { useLoanSheet } from "@/store/loanSheet";
import { userService } from "@/services/users";
import { loanService } from "@/services/loans";
import { RankBadge } from "@/components/RankBadge";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { RANK_XP, RANK_LIMIT, RANK_RATE } from "@/constants/config";
import { rankColors } from "@/constants/colors";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function formatIDR(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

function formatIDRFull(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

function XpBar({ rank, xp }: { rank: string; xp: number }) {
  const [min, max] = RANK_XP[rank] ?? [0, 100];
  const pct = max === Infinity ? 1 : Math.min((xp - min) / (max - min), 1);
  const nextRanks: Record<string, string> = {
    Iron: "Bronze", Bronze: "Silver", Silver: "Gold",
    Gold: "Platinum", Platinum: "Diamond", Diamond: "Ruby", Ruby: "Ruby",
  };
  const color = rankColors[rank]?.text ?? "#9fe870";

  return (
    <View className="gap-sm">
      <View className="flex-row justify-between items-center">
        <Text style={{ color, opacity: 0.8 }} className="text-xs">{xp} XP</Text>
        {max !== Infinity ? (
          <Text style={{ color, opacity: 0.8 }} className="text-xs">
            {max - xp} XP to {nextRanks[rank]}
          </Text>
        ) : (
          <Text style={{ color, opacity: 0.8 }} className="text-xs">Max rank</Text>
        )}
      </View>
      <View className="h-1 bg-black/20 rounded-pill overflow-hidden">
        <View
          style={{ width: `${Math.max(pct * 100, 4)}%`, backgroundColor: color }}
          className="h-full rounded-pill"
        />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1 items-center gap-xs">
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#9fe870", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color="#0e0f0c" />
      </View>
      <Text className="text-xs font-sans-medium text-ink">{label}</Text>
    </TouchableOpacity>
  );
}

interface LeaderboardEntry {
  rank_position: number;
  full_name: string;
  rank: string;
  xp: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, fetchProfile, logout } = useAuthStore();
  const { loans, fetchLoans, isLoading: loansLoading } = useLoansStore();
  const { open: openLoanSheet } = useLoanSheet();
  const [rankData, setRankData] = useState<any>(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextDue, setNextDue] = useState<{ loanId: number; rep: Repayment } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadNextDue = async (disbursedLoanIds: number[]) => {
    if (disbursedLoanIds.length === 0) { setNextDue(null); return; }
    try {
      const results = await Promise.all(
        disbursedLoanIds.map((id) => loanService.getRepayments(id).then((r) => ({ id, reps: r.data as Repayment[] })))
      );
      let earliest: { loanId: number; rep: Repayment } | null = null;
      const now = new Date();
      for (const { id, reps } of results) {
        const unpaid = reps.filter((r) => !r.paid_at).sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
        if (unpaid.length > 0) {
          if (!earliest || new Date(unpaid[0].due_date) < new Date(earliest.rep.due_date)) {
            earliest = { loanId: id, rep: unpaid[0] };
          }
        }
      }
      setNextDue(earliest);
    } catch {
      setNextDue(null);
    }
  };

  const load = async () => {
    try {
      const [, rankRes, lbRes] = await Promise.all([
        fetchLoans("approved"),
        userService.getRank(),
        userService.getLeaderboard(),
      ]);
      setRankData(rankRes.data);
      setLeaderboard((lbRes.data ?? []).slice(0, 5));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        await logout();
      }
    } finally {
      setRankLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const disbursed = loans.filter((l) => l.loan_status === "disbursed").map((l) => l.id);
    loadNextDue(disbursed);
  }, [loans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), load()]);
    setRefreshing(false);
  };

  const rank = rankData?.rank ?? user?.rank ?? "Gold";
  const xp = rankData?.xp ?? user?.xp ?? 0;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const activeLoans = loans.filter((l) => ["approved", "disbursed"].includes(l.loan_status));

  const fullLimit = RANK_LIMIT[rank] ?? 0;
  const now = new Date();
  const usedLimit = loans
    .filter((l) => {
      const d = new Date(l.created_at);
      return (
        ["approved", "disbursed"].includes(l.loan_status) &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, l) => sum + (l.loan_amnt ?? 0), 0);
  const remainingLimit = Math.max(fullLimit - usedLimit, 0);
  const cardId = `${rank[0]} ${rank[0]} ${(user?.id ?? 0).toString().padStart(4, "0").slice(-4)}`;

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* ─── Header ─── */}
        <View style={{ paddingTop: insets.top + 48 }} className="px-xl pb-lg">
          {user ? (
            <Text className="text-white" style={{ fontFamily: "PixelifySans_400Regular", fontSize: 32}}>Hi, {firstName}</Text>
          ) : (
            <Skeleton height={28} width="40%" rounded="md" style={{ marginTop: 4 }} />
          )}
        </View>

        {/* ─── Rank & Limit Section ─── */}
        {rankLoading ? (
          <View className="mx-xl">
            <Skeleton height={200} rounded="xl" />
          </View>
        ) : (
          <View className="mx-xl">
            {/* Remaining limit */}
            <View className="mb-lg">
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "DMSans_500Medium", letterSpacing: 0, marginBottom: 4 }}>
                Sisa limit bulan ini
              </Text>
              <Text style={{ color: "#fff", fontSize: 28, fontFamily: "DMSans_700Bold", letterSpacing: -0.5 }}>
                Rp {remainingLimit.toLocaleString("id-ID")}
              </Text>
            </View>

            {/* Two-card row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Left — rank card */}
              <View style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <RankBadge rank={rank} size={48} />
                  <View>
                    <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold", lineHeight: 22 }}>{rank}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "DMSans_400Regular" }}>Bunga {RANK_RATE[rank] ?? 0}%</Text>
                  </View>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>
                  Max limit
                </Text>
                <Text style={{ color: "#fff", fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                  Rp {fullLimit.toLocaleString("id-ID")}
                </Text>
              </View>

              {/* Right — apply button */}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/apply")}
                activeOpacity={0.7}
                style={{ width: 110, backgroundColor: "rgba(159,232,112,0.15)", borderRadius: 16, borderWidth: 2, borderColor: "rgba(159,232,112,0.5)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Ionicons name="add" size={28} color="rgba(255,255,255,1)" />
                <Text style={{ color: "rgba(255,255,255,1)", fontSize: 12, fontFamily: "DMSans_500Medium" }}>Ajukan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Quick Actions ─── */}
        <View className="px-xl mt-2xl flex-row gap-sm">
          <QuickAction icon="ribbon-outline" label="Quest" onPress={() => router.push("/(tabs)/quests")} />
          <QuickAction icon="trophy-outline" label="Rank" onPress={() => router.push("/(tabs)/leaderboard")} />
          <QuickAction icon="time-outline" label="Riwayat" onPress={() => router.push("/(tabs)/status")} />

        </View>

        {/* ─── Next Due Payment ─── */}
        {nextDue && (() => {
          const { loanId, rep } = nextDue;
          const isOverdue = new Date(rep.due_date) < new Date();
          const daysUntil = Math.ceil(
            (new Date(rep.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const dueSoon = !isOverdue && daysUntil <= 7;
          return (
            <TouchableOpacity
              className="mx-xl mt-xl"
              activeOpacity={0.85}
              onPress={() => openLoanSheet(loanId)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16 }}>
                <View className="flex-row items-center gap-md flex-1">
                  
                  <View className="flex-1">
                    <Text className={`text-sm text-white font-sans-semibold ${
                      isOverdue ? "text-negative" : dueSoon ? "text-warning" : "text-mute"
                    }`}>
                      {isOverdue ? "Cicilan Terlambat" : dueSoon ? "Jatuh Tempo Segera" : "Tagihan Terdekat"}
                    </Text>
                    <Text className="text-2xl font-sans-bold text-ink">
                      Rp {(rep.amount + rep.penalty).toLocaleString("id-ID")}
                    </Text>
                    <Text className="text-xs text-mute">
                      {isOverdue
                        ? `Terlambat ${Math.abs(daysUntil)} hari`
                        : daysUntil === 0
                        ? "Jatuh tempo hari ini"
                        : `${daysUntil} hari lagi`}
                      {" · "}
                      {new Date(rep.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-lg px-md py-xs ${isOverdue ? "bg-negative" : "bg-primary"}`}>
                  <Text className={`text-xs font-sans-semibold ${isOverdue ? "text-white" : "text-on-primary"}`}>
                    Bayar
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* ─── Active Loans ─── */}
        <View className="px-xl mt-xl">
          <Text className="text-xl font-sans-semibold text-ink mb-sm">Pinjaman Aktif</Text>

          {loansLoading && !refreshing ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard />
            </View>
          ) : activeLoans.length === 0 ? (
            <View className="rounded-xl px-xl py-2xl items-center gap-sm border">
              <Text className="text-sm text-mute text-center">Belum ada pinjaman aktif</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/apply")}
                className="bg-primary rounded-pill px-xl py-sm mt-xs"
              >
                <Text className="text-xs font-sans-semibold text-on-primary">Ajukan sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                onPress={() => openLoanSheet(loan.id)}
                activeOpacity={0.85}
                className="rounded-xl p-lg mb-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xs text-body font-light capitalize mb-xxs">
                      {loan.loan_intent.replace("HOMEIMPROVEMENT", "Home Renovation").replace("DEBTCONSOLIDATION", "Debt Consol.").toLowerCase()}
                    </Text>
                    <Text className="text-base font-sans-bold text-ink">{formatIDRFull(loan.loan_amnt)}</Text>
                    <Text className="text-xs text-body mt-xxs">
                      Total {formatIDRFull(loan.monthly_installment * loan.tenure_months)} dalam {loan.tenure_months} bulan
                    </Text>
                  </View>
                  <View className="items-end gap-xs">
                    <View className="rounded-pill px-md py-xxs">
                      <Text className="text-xs font-sans-semibold text-primary">
                        {loan.loan_status === "disbursed" ? "Aktif" : "Disetujui"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
