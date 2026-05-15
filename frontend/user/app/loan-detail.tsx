import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLoansStore, Repayment } from "@/store/loans";
import { useAuthStore } from "@/store/auth";
import { loanService } from "@/services/loans";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { useToast, Toast } from "@/components/ui/Toast";
import { LOAN_INTENTS } from "@/constants/config";

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ── Accept Offer Modal ────────────────────────────────────────────────────────

function AcceptOfferModal({
  visible,
  loanId,
  monthly,
  onClose,
  onSuccess,
  onError,
}: {
  visible: boolean;
  loanId: number;
  monthly: number;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [pin, setPin] = useState("      ");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleConfirm = async () => {
    const trimmed = pin.trim();
    if (trimmed.length < 6) {
      onError("Masukkan 6 digit PIN");
      return;
    }
    setLoading(true);
    try {
      await loanService.acceptOffer(loanId, trimmed);
      setPin("      ");
      onClose();
      onSuccess();
    } catch (err: any) {
      onError(err?.response?.data?.detail ?? "Gagal menerima penawaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-canvas rounded-t-3xl px-xl pt-xl"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />

          <Text className="text-lg font-sans-black text-ink mb-xs">Terima Penawaran Pinjaman</Text>
          <Text className="text-sm text-mute mb-xl">
            Masukkan PIN 6 digit untuk menyetujui dan mencairkan dana.
          </Text>

          <View className="bg-canvas-soft rounded-xl px-lg py-md mb-xl">
            <Text className="text-xs text-mute mb-xxs">Total tagihan</Text>
            <Text className="text-xl font-sans-black text-ink">{formatIDR(monthly)}</Text>
            <Text className="text-xs text-mute mt-xxs">Dibayar sekali sebelum akhir tenor</Text>
          </View>

          <OtpInput value={pin} onChange={setPin} length={6} secureTextEntry />

          <View className="gap-sm mt-xl">
            <Button
              label={loading ? "Memproses…" : "Cairkan Dana"}
              loading={loading}
              onPress={handleConfirm}
            />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

interface PaymentResult {
  xp_gained: number;
  new_rank: string;
  loan_closed: boolean;
}

function PaymentModal({
  repayment,
  loanId,
  onClose,
  onSuccess,
  onError,
}: {
  repayment: Repayment | null;
  loanId: number;
  onClose: () => void;
  onSuccess: (result: PaymentResult) => void;
  onError: (msg: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const insets = useSafeAreaInsets();

  const total = repayment ? repayment.amount + repayment.penalty : 0;
  const isOverdue = repayment
    ? !repayment.paid_at && new Date(repayment.due_date) < new Date()
    : false;

  const handleConfirm = async () => {
    if (!repayment) return;
    setPaying(true);
    try {
      const res = await loanService.payInstallment(loanId, repayment.id);
      onClose();
      onSuccess(res.data);
    } catch (err: any) {
      onError(err?.response?.data?.detail ?? "Pembayaran gagal");
      setPaying(false);
    }
  };

  return (
    <Modal
      visible={!!repayment}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-canvas rounded-t-3xl px-xl pt-xl"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />

          <Text className="text-lg font-sans-black text-ink mb-xs">Konfirmasi Pembayaran</Text>
          <Text className="text-sm text-mute mb-xl">
            Cicilan #{repayment?.installment_number} · jatuh tempo{" "}
            {repayment
              ? new Date(repayment.due_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </Text>

          <View className="bg-canvas-soft rounded-xl px-lg py-md mb-xl gap-sm">
            <View className="flex-row justify-between">
              <Text className="text-sm text-mute">Pokok cicilan</Text>
              <Text className="text-sm font-sans-semibold text-ink">
                {repayment ? formatIDR(repayment.amount) : "—"}
              </Text>
            </View>
            {repayment && repayment.penalty > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-negative">Denda keterlambatan</Text>
                <Text className="text-sm font-sans-semibold text-negative">
                  +{formatIDR(repayment.penalty)}
                </Text>
              </View>
            )}
            <View className="h-px bg-ink/10" />
            <View className="flex-row justify-between">
              <Text className="text-sm font-sans-semibold text-ink">Total dibayar</Text>
              <Text className="text-base font-sans-black text-ink">{formatIDR(total)}</Text>
            </View>
          </View>

          {isOverdue && (
            <View className="bg-negative/10 rounded-xl px-lg py-md mb-lg flex-row items-center gap-sm">
              <Ionicons name="warning-outline" size={16} color="#f87171" />
              <Text className="text-xs text-negative flex-1">
                Cicilan ini terlambat. Denda telah ditambahkan.
              </Text>
            </View>
          )}

          <View className="gap-sm">
            <Button
              label={paying ? "Memproses…" : "Bayar Sekarang"}
              loading={paying}
              onPress={handleConfirm}
            />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={paying} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  paid: "bg-primary-pale text-positive-deep",
  unpaid: "bg-canvas-soft text-body",
  overdue: "bg-negative/10 text-negative",
};

export default function LoanDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeLoan, fetchLoanDetail, isLoading } = useLoansStore();
  const { fetchProfile } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (id) await fetchLoanDetail(Number(id));
  };

  useEffect(() => { load(); }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAcceptSuccess = async () => {
    show("Dana berhasil dicairkan! Cicilan pertama dimulai bulan depan.", "success");
    await load();
  };

  const handlePaySuccess = async (result: PaymentResult) => {
    const msg = result.loan_closed
      ? `Pinjaman lunas! +${result.xp_gained} XP · Rank: ${result.new_rank}`
      : `Pembayaran berhasil! +${result.xp_gained} XP · ${result.new_rank}`;
    show(msg, "success");
    await Promise.all([load(), fetchProfile()]);
  };

  const loan = activeLoan;
  const intentLabel =
    LOAN_INTENTS.find((i) => i.value === loan?.loan_intent)?.label ?? loan?.loan_intent;

  const isApproved = loan?.loan_status === "approved";
  const isDisbursed = loan?.loan_status === "disbursed";

  const paidCount = (loan?.repayments ?? []).filter((r) => r.paid_at).length;
  const totalCount = loan?.repayments?.length ?? 0;

  return (
    <View className="flex-1 bg-canvas-soft">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-xl pb-lg flex-row items-center gap-md"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>
        <Text className="text-lg font-sans-black text-ink">Detail Pinjaman</Text>
      </View>

      {isLoading && !refreshing ? (
        <View className="px-xl gap-sm">
          <SkeletonCard />
          <Skeleton height={200} rounded="xl" />
        </View>
      ) : !loan ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-mute">Pinjaman tidak ditemukan</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* ── Summary card ── */}
          <Card variant="dark" className="mb-lg gap-sm">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-xs text-primary/70">{intentLabel}</Text>
                <Text className="text-3xl font-sans-black text-primary">
                  {formatIDR(loan.loan_amnt)}
                </Text>
              </View>
              <View
                className={`rounded-pill px-md py-xs ${
                  isDisbursed ? "bg-primary/20" : "bg-canvas/10"
                }`}
              >
                <Text className="text-xs font-sans-semibold text-primary capitalize">
                  {isDisbursed
                    ? "Aktif"
                    : isApproved
                    ? "Disetujui"
                    : loan.loan_status.replace("_", " ")}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-lg mt-xs">
              <View>
                <Text className="text-xs text-primary/60">Total tagihan</Text>
                <Text className="text-sm font-sans-semibold text-primary">
                  {formatIDR(loan.monthly_installment * loan.tenure_months)}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-primary/60">Tenor</Text>
                <Text className="text-sm font-sans-semibold text-primary">
                  {loan.tenure_months} bulan
                </Text>
              </View>
              <View>
                <Text className="text-xs text-primary/60">Bunga</Text>
                <Text className="text-sm font-sans-semibold text-primary">
                  {loan.loan_int_rate}% p.a.
                </Text>
              </View>
            </View>

            {isDisbursed && totalCount > 0 && (
              <View className="mt-sm pt-sm border-t border-white/10">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-primary/60">Status pelunasan</Text>
                  <View className={`rounded-pill px-sm py-xxs ${paidCount > 0 ? "bg-positive/20" : "bg-black/20"}`}>
                    <Text className={`text-xs font-sans-semibold ${paidCount > 0 ? "text-positive-deep" : "text-primary/60"}`}>
                      {paidCount > 0 ? "Lunas" : "Belum dibayar"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* ── Accept Offer Banner ── */}
          {isApproved && (
            <View className="bg-primary-pale border border-primary/30 rounded-xl px-lg py-md mb-lg">
              <View className="flex-row items-center gap-sm mb-md">
                <Ionicons name="checkmark-circle" size={20} color="#9fe870" />
                <Text className="text-sm font-sans-bold text-primary">
                  Pinjaman Anda Disetujui
                </Text>
              </View>
              <Text className="text-xs text-mute leading-5 mb-lg">
                Total tagihan {formatIDR(loan.monthly_installment * loan.tenure_months)} — dibayar sekali sebelum {loan.tenure_months} bulan berakhir.
                Konfirmasi dengan PIN untuk mencairkan dana.
              </Text>
              <Button
                label="Terima & Cairkan Dana"
                onPress={() => setShowAcceptModal(true)}
              />
            </View>
          )}

          {/* ── ML score ── */}
          {loan.confidence != null && (
            <Card variant="sage" className="mb-lg">
              <View className="flex-row justify-between">
                <Text className="text-sm text-body">ML Confidence Score</Text>
                <Text className="text-sm font-sans-semibold text-ink">
                  {Math.round(loan.confidence * 100)}%
                </Text>
              </View>
              {loan.review_note && (
                <Text className="text-xs text-body mt-sm">Catatan: {loan.review_note}</Text>
              )}
            </Card>
          )}

          {/* ── Payment ── */}
          <Text className="text-base font-sans-semibold text-ink mb-sm">Tagihan</Text>

          {(loan.repayments ?? []).length === 0 ? (
            <Card variant="sage">
              <Text className="text-sm text-mute text-center">
                {isApproved
                  ? "Tagihan akan dibuat setelah Anda menerima penawaran"
                  : loan.loan_status === "manual_review"
                  ? "Menunggu tinjauan admin"
                  : "Belum ada tagihan"}
              </Text>
            </Card>
          ) : (() => {
            const rep = loan.repayments![0];
            const isOverdue = !rep.paid_at && new Date(rep.due_date) < new Date();
            const daysLeft = Math.ceil(
              (new Date(rep.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <View
                className={`rounded-xl p-lg ${
                  rep.paid_at
                    ? "bg-primary-pale border border-positive/20"
                    : isOverdue
                    ? "bg-negative/5 border border-negative/20"
                    : "bg-canvas border border-white/[0.06]"
                }`}
              >
                {/* Amount row */}
                <View className="flex-row items-center justify-between mb-md">
                  <View>
                    <Text className="text-xs text-mute mb-xxs">Total tagihan</Text>
                    <Text className="text-2xl font-sans-black text-ink">
                      {formatIDR(rep.amount + rep.penalty)}
                    </Text>
                    {rep.penalty > 0 && (
                      <Text className="text-xs text-negative mt-xxs">
                        Termasuk denda {formatIDR(rep.penalty)}
                      </Text>
                    )}
                  </View>
                  {rep.paid_at ? (
                    <View className="bg-positive/20 rounded-full w-12 h-12 items-center justify-center">
                      <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
                    </View>
                  ) : (
                    <View className={`rounded-full w-12 h-12 items-center justify-center ${
                      isOverdue ? "bg-negative/20" : "bg-primary/20"
                    }`}>
                      <Ionicons
                        name={isOverdue ? "warning-outline" : "time-outline"}
                        size={22}
                        color={isOverdue ? "#f87171" : "#9fe870"}
                      />
                    </View>
                  )}
                </View>

                {/* Due date row */}
                <View className="flex-row items-center justify-between py-sm border-t border-ink/10">
                  <View>
                    <Text className="text-xs text-mute">Jatuh tempo</Text>
                    <Text className="text-sm font-sans-semibold text-ink">
                      {new Date(rep.due_date).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </Text>
                  </View>
                  {rep.paid_at ? (
                    <Text className="text-xs text-positive-deep">
                      Dibayar {new Date(rep.paid_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short",
                      })}
                    </Text>
                  ) : (
                    <Text className={`text-xs font-sans-semibold ${
                      isOverdue ? "text-negative" : daysLeft <= 7 ? "text-warning" : "text-mute"
                    }`}>
                      {isOverdue
                        ? `Terlambat ${Math.abs(daysLeft)} hari`
                        : daysLeft === 0
                        ? "Hari ini"
                        : `${daysLeft} hari lagi`}
                    </Text>
                  )}
                </View>

                {!rep.paid_at && (
                  <TouchableOpacity
                    onPress={() => setSelectedRepayment(rep)}
                    activeOpacity={0.8}
                    className={`mt-md rounded-xl py-md items-center ${
                      isOverdue ? "bg-negative" : "bg-primary"
                    }`}
                  >
                    <Text className={`text-sm font-sans-semibold ${
                      isOverdue ? "text-white" : "text-on-primary"
                    }`}>
                      Bayar Sekarang
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}
        </ScrollView>
      )}

      <AcceptOfferModal
        visible={showAcceptModal}
        loanId={Number(id)}
        monthly={(loan?.monthly_installment ?? 0) * (loan?.tenure_months ?? 1)}
        onClose={() => setShowAcceptModal(false)}
        onSuccess={handleAcceptSuccess}
        onError={(msg) => show(msg, "error")}
      />

      <PaymentModal
        repayment={selectedRepayment}
        loanId={Number(id)}
        onClose={() => setSelectedRepayment(null)}
        onSuccess={(result) => handlePaySuccess(result)}
        onError={(msg) => show(msg, "error")}
      />

      <Toast {...toast} onHide={hide} />
    </View>
  );
}
