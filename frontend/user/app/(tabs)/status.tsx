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
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";

const TABS: { key: LoanTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "approved", label: "Disetujui" },
  { key: "in_review", label: "Ditinjau" },
  { key: "unpaid", label: "Belum Lunas" },
  { key: "closed", label: "Lunas" },
  { key: "rejected", label: "Ditolak" },
];

const STATUS_COLOR: Record<string, string> = {
  approved: "text-positive-deep bg-primary-pale",
  disbursed: "text-positive-deep bg-primary-pale",
  manual_review: "text-warning-content bg-warning/20",
  rejected: "text-negative bg-negative-bg",
  closed: "text-mute bg-canvas",
  pending: "text-mute bg-canvas",
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function LoanCard({ loan, onPress }: { loan: Loan; onPress: () => void }) {
  const colorClass = STATUS_COLOR[loan.loan_status] ?? "text-body bg-canvas-soft";
  const [bg, fg] = colorClass.split(" ");

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-sm">
      <Card variant="white">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 gap-xxs">
            <Text className="text-xs text-mute capitalize">
              {loan.loan_intent.replace("HOMEIMPROVEMENT", "Home Renovation").replace("DEBTCONSOLIDATION", "Debt Consol.").toLowerCase()}
            </Text>
            <Text className="text-lg font-sans-semibold text-ink">{formatIDR(loan.loan_amnt)}</Text>
            <Text className="text-xs text-body">
              Total {formatIDR(loan.monthly_installment * loan.tenure_months)} · {loan.tenure_months} bln · {loan.loan_int_rate}% p.a.
            </Text>
            <Text className="text-xs text-mute">
              {new Date(loan.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View className={`rounded-pill px-md py-xs ${fg}`}>
            <Text className={`text-xs font-sans-semibold ${bg}`}>
              {loan.loan_status === "disbursed" ? "Aktif" : loan.loan_status === "manual_review" ? "Ditinjau" : loan.loan_status === "rejected" ? "Ditolak" : loan.loan_status === "approved" ? "Disetujui" : loan.loan_status === "closed" ? "Lunas" : loan.loan_status}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function StatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loans, fetchLoans, isLoading } = useLoansStore();
  const [activeTab, setActiveTab] = useState<LoanTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchLoans(activeTab); }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans(activeTab);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
      >
        {/* Header */}
        <View className="px-lg pb-sm">
          <Text className="text-2xl font-sans-black text-ink">Riwayat</Text>
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexShrink: 0, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, alignItems: "center" }}
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
        <View className="px-lg mt-xs">
          {isLoading && !refreshing ? (
            <View className="gap-sm">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </View>
          ) : loans.length === 0 ? (
            <Card variant="sage" className="mt-sm">
              <Text className="text-sm text-mute text-center">Tidak ada pinjaman di kategori ini</Text>
            </Card>
          ) : (
            loans.map((item) => (
              <LoanCard
                key={item.id}
                loan={item}
                onPress={() => router.push({ pathname: "/loan-detail", params: { id: item.id } })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
