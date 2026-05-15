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
import { useLoansStore, Loan } from "@/store/loans";
import { LoanTab } from "@/services/loans";
import { useAuthStore } from "@/store/auth";
import { useLoanSheet } from "@/store/loanSheet";
import { SkeletonCard } from "@/components/ui/Skeleton";

const TABS: { key: LoanTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "approved", label: "Disetujui" },
  { key: "in_review", label: "Ditinjau" },
  { key: "unpaid", label: "Belum Lunas" },
  { key: "closed", label: "Lunas" },
  { key: "rejected", label: "Ditolak" },
];

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<string, string> = {
  disbursed: "Aktif", approved: "Disetujui", manual_review: "Ditinjau",
  rejected: "Ditolak", closed: "Lunas", pending: "Pending",
};

const STATUS_TEXT_COLOR: Record<string, string> = {
  approved: "#9fe870", disbursed: "#9fe870",
  manual_review: "#ffd11a", rejected: "#f87171",
  closed: "#525550", pending: "#525550",
};

function LoanCard({ loan, onPress }: { loan: Loan; onPress: () => void }) {
  const statusColor = STATUS_TEXT_COLOR[loan.loan_status] ?? "#525550";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="p-lg" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-body font-light capitalize mb-xxs">
            {loan.loan_intent.replace("HOMEIMPROVEMENT", "Home Renovation").replace("DEBTCONSOLIDATION", "Debt Consol.").toLowerCase()}
          </Text>
          <Text className="text-xl font-sans-bold text-ink">{formatIDR(loan.loan_amnt)}</Text>
          <Text className="text-xs text-body mt-xxs">
            Total {formatIDR(loan.monthly_installment * loan.tenure_months)} · {loan.tenure_months} bln
          </Text>
        </View>
        <View className="items-end gap-xs">
          <Text style={{ color: statusColor }} className="text-xs font-sans-semibold">
            {STATUS_LABEL[loan.loan_status] ?? loan.loan_status}
          </Text>
          <Text className="text-xs text-mute">
            {new Date(loan.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function StatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loans, fetchLoans, isLoading } = useLoansStore();
  const { logout } = useAuthStore();
  const { open: openLoanSheet } = useLoanSheet();
  const [activeTab, setActiveTab] = useState<LoanTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (tab: LoanTab) => {
    try {
      await fetchLoans(tab);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) logout();
    }
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeTab);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* Header */}
        <View className="px-xl pb-sm">
          <Text className="text-2xl font-sans-black text-ink">Riwayat</Text>
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexShrink: 0, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, alignItems: "center" }}
        >
          {TABS.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setActiveTab(item.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                borderWidth: 1,
                marginRight: i < TABS.length - 1 ? 8 : 0,
                borderColor: activeTab === item.key ? "#9fe870" : "rgba(255,255,255,0.1)",
                backgroundColor: activeTab === item.key ? "#9fe870" : "#161915",
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: activeTab === item.key ? "#0e0f0c" : "#525550" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View className="px-xl mt-xs">
          {isLoading && !refreshing ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </View>
          ) : loans.length === 0 ? (
            <View className="mt-sm rounded-xl p-xl">
              <Text className="text-sm text-mute text-center">Tidak ada pinjaman di kategori ini</Text>
            </View>
          ) : (
            loans.map((item) => (
              <LoanCard
                key={item.id}
                loan={item}
                onPress={() => openLoanSheet(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
