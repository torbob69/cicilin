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

function QuickAction({
  icon, label, onPress, accent = false,
}: {
  icon: IoniconName; label: string; onPress: () => void; accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-1 rounded-xl p-md items-center gap-xs border ${accent ? "bg-primary border-primary" : "bg-canvas border-white/[0.06]"
        }`}
    >
      <Ionicons name={icon} size={18} color={accent ? "#0e0f0c" : "#e8ebe6"} />
      <Text
        className={`text-xs font-sans-medium text-center ${accent ? "text-on-primary" : "text-ink"
          }`}
      >
        {label}
      </Text>
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
      if (status === 401 || status === 403) {
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

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* ─── Header ─── */}
        <View style={{ paddingTop: insets.top + 20 }} className="px-xl pb-lg">
          {user ? (
            <Text className="text-2xl font-sans-bold text-ink">Hi, {firstName}</Text>
          ) : (
            <Skeleton height={28} width="40%" rounded="md" style={{ marginTop: 4 }} />
          )}
        </View>

        {/* ─── Rank Card ─── */}
        {rankLoading ? (
          <View className="mx-xl">
            <Skeleton height={160} rounded="xl" />
          </View>
        ) : (
          <View
            className="mx-xl rounded-2xl overflow-hidden"
            style={{ backgroundColor: rankColors[rank]?.bg ?? "#161915" }}
          >
            <View className="px-xl pt-xl pb-md flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: rankColors[rank]?.text ?? "#fff", opacity: 0.7 }} className="text-xs mb-xxs tracking-wider uppercase font-sans-medium">Rank</Text>
                <Text style={{ color: rankColors[rank]?.text ?? "#fff" }} className="text-4xl font-sans-black leading-tight tracking-tight">{rank}</Text>
                <Text style={{ color: rankColors[rank]?.text ?? "#fff", opacity: 0.6 }} className="text-sm font-sans-medium mt-xxs">{xp.toLocaleString("id-ID")} XP</Text>
              </View>
              <RankBadge rank={rank} size={72} />
            </View>

            <View className="px-xl pb-lg">
              <XpBar rank={rank} xp={xp} />
            </View>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} className="flex-row">
              <View className="flex-1 px-xl py-md border-r border-black/10">
                <Text style={{ color: rankColors[rank]?.text ?? "#fff", opacity: 0.7 }} className="text-xs mb-xxs">Limit bulanan</Text>
                <Text style={{ color: rankColors[rank]?.text ?? "#fff" }} className="text-sm font-sans-bold">{formatIDR(RANK_LIMIT[rank] ?? 0)}</Text>
              </View>
              <View className="flex-1 px-xl py-md">
                <Text style={{ color: rankColors[rank]?.text ?? "#fff", opacity: 0.7 }} className="text-xs mb-xxs">Bunga</Text>
                <Text style={{ color: rankColors[rank]?.text ?? "#fff" }} className="text-sm font-sans-bold">{RANK_RATE[rank] ?? 0}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Quick Actions ─── */}
        <View className="px-xl mt-lg flex-row gap-sm">
          <QuickAction icon="card-outline" label="Ajukan" onPress={() => router.push("/(tabs)/apply")} accent />
          <QuickAction icon="receipt-outline" label="Status" onPress={() => router.push("/(tabs)/status")} />
          <QuickAction icon="trophy-outline" label="Rank" onPress={() => router.push("/(tabs)/leaderboard")} />
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
              onPress={() => router.push({ pathname: "/loan-detail", params: { id: loanId } })}
            >
              <View className={`px-lg py-md flex-row items-center justify-between border`}>
                <View className="flex-row items-center gap-md flex-1">
                  {/* <View className={`w-9 h-9 rounded-full items-center justify-center ${
                    isOverdue ? "bg-negative/20" : dueSoon ? "bg-warning/20" : "bg-primary/20"
                  }`}>
                    <Ionicons
                      name={isOverdue ? "warning-outline" : "calendar-outline"}
                      size={16}
                      color={isOverdue ? "#f87171" : dueSoon ? "#ffd11a" : "#9fe870"}
                    />
                  </View> */}
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

        {/* ─── Leaderboard ─── */}
        {leaderboard.length > 0 && (
          <View className="px-xl mt-xl">
            <View className="flex-row items-center justify-between mb-sm">
              <Text className="text-xl font-sans-semibold text-ink">Leaderboard</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")}>
                <Text className="text-xs font-sans-semibold text-primary">Lihat semua</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-canvas rounded-xl overflow-hidden border border-white/[0.06]">
              {leaderboard.map((entry, i) => {
                const isMe = entry.full_name === user?.full_name;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <View
                    key={entry.rank_position}
                    className={`flex-row items-center px-lg py-md ${i < leaderboard.length - 1 ? "border-b border-white/[0.04]" : ""} ${isMe ? "bg-primary/10" : ""}`}
                  >
                    <Text className="text-sm font-sans-bold text-mute w-6">
                      {medal ?? `${entry.rank_position}`}
                    </Text>
                    <View className="flex-1 ml-md">
                      <Text className={`text-sm font-sans-semibold ${isMe ? "text-primary" : "text-ink"}`} numberOfLines={1}>
                        {entry.full_name}{isMe ? " (Kamu)" : ""}
                      </Text>
                      <Text className="text-xs text-mute">{entry.rank}</Text>
                    </View>
                    <Text className="text-sm font-sans-bold text-ink">{entry.xp.toLocaleString("id-ID")} XP</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Active Loans ─── */}
        <View className="px-xl mt-xl">
          <Text className="text-xl font-sans-semibold text-ink mb-sm">Pinjaman Aktif</Text>

          {loansLoading && !refreshing ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard />
            </View>
          ) : activeLoans.length === 0 ? (
            <View className="bg-canvas rounded-xl px-xl py-2xl items-center gap-sm border border-white/[0.06]">
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
                onPress={() => router.push({ pathname: "/loan-detail", params: { id: loan.id } })}
                activeOpacity={0.85}
                className="bg-canvas rounded-xl p-lg mb-sm border border-white/[0.06]"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xs text-mute capitalize mb-xxs">
                      {loan.loan_intent.replace("HOMEIMPROVEMENT", "Home Renovation").replace("DEBTCONSOLIDATION", "Debt Consol.").toLowerCase()}
                    </Text>
                    <Text className="text-base font-sans-bold text-ink">{formatIDRFull(loan.loan_amnt)}</Text>
                    <Text className="text-xs text-body mt-xxs">
                      Total {formatIDRFull(loan.monthly_installment * loan.tenure_months)} · {loan.tenure_months} bulan
                    </Text>
                  </View>
                  <View className="items-end gap-xs">
                    <View className="bg-primary-pale rounded-pill px-md py-xxs">
                      <Text className="text-xs font-sans-semibold text-positive-deep">
                        {loan.loan_status === "disbursed" ? "Aktif" : "Disetujui"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#525550" />
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
