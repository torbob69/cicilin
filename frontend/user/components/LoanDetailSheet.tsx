import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLoansStore, Repayment } from "@/store/loans";
import { useAuthStore } from "@/store/auth";
import { useLoanSheet } from "@/store/loanSheet";
import { loanService } from "@/services/loans";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { useToast, Toast } from "@/components/ui/Toast";
import { LOAN_INTENTS } from "@/constants/config";

const SCREEN_HEIGHT = Dimensions.get("window").height;

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ── Accept Offer Modal ────────────────────────────────────────────────────────

function AcceptOfferModal({
  visible, loanId, monthly, onClose, onSuccess, onError,
}: {
  visible: boolean; loanId: number; monthly: number;
  onClose: () => void; onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [pin, setPin] = useState("      ");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleConfirm = async () => {
    const trimmed = pin.trim();
    if (trimmed.length < 6) { onError("Masukkan 6 digit PIN"); return; }
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-canvas rounded-t-3xl px-xl pt-xl" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />
          <Text className="text-lg font-sans-black text-ink mb-xs">Terima Penawaran Pinjaman</Text>
          <Text className="text-sm text-mute mb-xl">Masukkan PIN 6 digit untuk menyetujui dan mencairkan dana.</Text>
          <View className="bg-canvas-soft rounded-xl px-lg py-md mb-xl">
            <Text className="text-xs text-mute mb-xxs">Total tagihan</Text>
            <Text className="text-xl font-sans-black text-ink">{formatIDR(monthly)}</Text>
            <Text className="text-xs text-mute mt-xxs">Dibayar sekali sebelum akhir tenor</Text>
          </View>
          <OtpInput value={pin} onChange={setPin} length={6} secureTextEntry />
          <View className="gap-sm mt-xl">
            <Button label={loading ? "Memproses…" : "Cairkan Dana"} loading={loading} onPress={handleConfirm} />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

interface PaymentResult { xp_gained: number; new_rank: string; loan_closed: boolean; }

function PaymentModal({
  repayment, loanId, onClose, onSuccess, onError,
}: {
  repayment: Repayment | null; loanId: number;
  onClose: () => void; onSuccess: (r: PaymentResult) => void; onError: (msg: string) => void;
}) {
  const [paying, setPaying] = useState(false);
  const insets = useSafeAreaInsets();
  const total = repayment ? repayment.amount + repayment.penalty : 0;
  const isOverdue = repayment ? !repayment.paid_at && new Date(repayment.due_date) < new Date() : false;

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
    <Modal visible={!!repayment} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-canvas rounded-t-3xl px-xl pt-xl" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />
          <Text className="text-lg font-sans-black text-ink mb-xs">Konfirmasi Pembayaran</Text>
          <Text className="text-sm text-mute mb-xl">
            Cicilan #{repayment?.installment_number} · jatuh tempo{" "}
            {repayment ? new Date(repayment.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}
          </Text>
          <View className="bg-canvas-soft rounded-xl px-lg py-md mb-xl gap-sm">
            <View className="flex-row justify-between">
              <Text className="text-sm text-mute">Pokok cicilan</Text>
              <Text className="text-sm font-sans-semibold text-ink">{repayment ? formatIDR(repayment.amount) : "—"}</Text>
            </View>
            {repayment && repayment.penalty > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-negative">Denda keterlambatan</Text>
                <Text className="text-sm font-sans-semibold text-negative">+{formatIDR(repayment.penalty)}</Text>
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
              <Text className="text-xs text-negative flex-1">Cicilan ini terlambat. Denda telah ditambahkan.</Text>
            </View>
          )}
          <View className="gap-sm">
            <Button label={paying ? "Memproses…" : "Bayar Sekarang"} loading={paying} onPress={handleConfirm} />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={paying} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Status theme ─────────────────────────────────────────────────────────────

const STATUS_THEME: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  approved:      { color: "#9fe870", bg: "rgba(159,232,112,0.12)", label: "Disetujui",  icon: "checkmark-circle-outline" },
  disbursed:     { color: "#9fe870", bg: "rgba(159,232,112,0.12)", label: "Aktif",      icon: "flash-outline" },
  manual_review: { color: "#ffd11a", bg: "rgba(255,209,26,0.12)",  label: "Ditinjau",   icon: "time-outline" },
  rejected:      { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Ditolak",    icon: "close-circle-outline" },
  closed:        { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  label: "Lunas",      icon: "checkmark-done-circle-outline" },
  pending:       { color: "#868685", bg: "rgba(134,134,133,0.12)", label: "Menunggu",   icon: "ellipsis-horizontal-circle-outline" },
};

// ── Main Sheet ────────────────────────────────────────────────────────────────

export function LoanDetailSheet() {
  const { loanId, close } = useLoanSheet();
  const insets = useSafeAreaInsets();
  const { activeLoan, fetchLoanDetail, isLoading, clearActiveLoan } = useLoansStore();
  const { fetchProfile } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loanId !== null) {
      fetchLoanDetail(loanId);
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
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      clearActiveLoan();
    }
  }, [loanId]);

  const handleClose = () => {
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
    ]).start(() => close());
  };

  const onRefresh = async () => {
    if (!loanId) return;
    setRefreshing(true);
    await fetchLoanDetail(loanId);
    setRefreshing(false);
  };

  const handleAcceptSuccess = async () => {
    show("Dana berhasil dicairkan! Cicilan pertama dimulai bulan depan.", "success");
    if (loanId) await fetchLoanDetail(loanId);
  };

  const handlePaySuccess = async (result: PaymentResult) => {
    const msg = result.loan_closed
      ? `Pinjaman lunas! +${result.xp_gained} XP · Rank: ${result.new_rank}`
      : `Pembayaran berhasil! +${result.xp_gained} XP · ${result.new_rank}`;
    show(msg, "success");
    if (loanId) await Promise.all([fetchLoanDetail(loanId), fetchProfile()]);
  };

  if (loanId === null) return null;

  const loan = activeLoan;
  const intentLabel = LOAN_INTENTS.find((i) => i.value === loan?.loan_intent)?.label ?? loan?.loan_intent;
  const status = loan?.loan_status ?? "pending";
  const theme = STATUS_THEME[status] ?? STATUS_THEME.pending;
  const isApproved = status === "approved";
  const isDisbursed = status === "disbursed";
  const isRejected = status === "rejected";
  const isClosed = status === "closed";
  const isManualReview = status === "manual_review";
  const paidCount = (loan?.repayments ?? []).filter((r) => r.paid_at).length;
  const totalCount = loan?.repayments?.length ?? 0;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: backdropOpacity }}
        pointerEvents={loanId !== null ? "auto" : "none"}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          height: SCREEN_HEIGHT,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: "#0c0f0b",
          overflow: "hidden",
          transform: [{ translateY }],
        }}
      >
        {/* Handle + Header */}
        <View style={{ paddingTop: 12 }} className="px-xl pb-lg">
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-lg" />
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-sans-black text-ink">Detail Pinjaman</Text>
            <TouchableOpacity onPress={handleClose} className="w-8 h-8 rounded-full bg-canvas items-center justify-center">
              <Ionicons name="close" size={18} color="#e8ebe6" />
            </TouchableOpacity>
          </View>
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9fe870" />}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Summary card ── */}
            <View style={{ backgroundColor: theme.bg, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <View className="flex-row justify-between items-start mb-md">
                <View className="flex-1">
                  <Text style={{ color: theme.color, opacity: 0.7, fontSize: 11, marginBottom: 4 }}>{intentLabel}</Text>
                  <Text style={{ color: theme.color, fontSize: 32, fontFamily: "DMSans_700Bold", letterSpacing: -0.5 }}>
                    {formatIDR(loan.loan_amnt)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                  <Ionicons name={theme.icon as any} size={13} color={theme.color} />
                  <Text style={{ color: theme.color, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{theme.label}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View>
                  <Text style={{ color: theme.color, opacity: 0.55, fontSize: 11 }}>Total tagihan</Text>
                  <Text style={{ color: theme.color, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{formatIDR(loan.monthly_installment * loan.tenure_months)}</Text>
                </View>
                <View>
                  <Text style={{ color: theme.color, opacity: 0.55, fontSize: 11 }}>Tenor</Text>
                  <Text style={{ color: theme.color, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{loan.tenure_months} bulan</Text>
                </View>
                <View>
                  <Text style={{ color: theme.color, opacity: 0.55, fontSize: 11 }}>Bunga</Text>
                  <Text style={{ color: theme.color, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{loan.loan_int_rate}% p.a.</Text>
                </View>
              </View>
            </View>

            {/* ── Status banners ── */}
            {isApproved && (
              <View style={{ backgroundColor: "rgba(159,232,112,0.1)", borderWidth: 1, borderColor: "rgba(159,232,112,0.25)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <View className="flex-row items-center gap-sm mb-sm">
                  <Ionicons name="checkmark-circle" size={18} color="#9fe870" />
                  <Text style={{ color: "#9fe870", fontFamily: "DMSans_700Bold", fontSize: 14 }}>Pinjaman Disetujui</Text>
                </View>
                <Text className="text-xs text-mute leading-5 mb-md">
                  Total tagihan {formatIDR(loan.monthly_installment * loan.tenure_months)} — dibayar sekali sebelum {loan.tenure_months} bulan berakhir. Konfirmasi dengan PIN untuk mencairkan dana.
                </Text>
                <Button label="Terima & Cairkan Dana" onPress={() => setShowAcceptModal(true)} />
              </View>
            )}

            {isManualReview && (
              <View style={{ backgroundColor: "rgba(255,209,26,0.08)", borderWidth: 1, borderColor: "rgba(255,209,26,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <View className="flex-row items-center gap-sm mb-xs">
                  <Ionicons name="time" size={18} color="#ffd11a" />
                  <Text style={{ color: "#ffd11a", fontFamily: "DMSans_700Bold", fontSize: 14 }}>Sedang Ditinjau Admin</Text>
                </View>
                <Text className="text-xs text-mute leading-5">
                  Pengajuan kamu sedang diperiksa oleh tim kami. Biasanya membutuhkan 1–2 hari kerja. Kami akan memberitahu kamu segera.
                </Text>
              </View>
            )}

            {isRejected && (
              <View style={{ backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1, borderColor: "rgba(248,113,113,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <View className="flex-row items-center gap-sm mb-xs">
                  <Ionicons name="close-circle" size={18} color="#f87171" />
                  <Text style={{ color: "#f87171", fontFamily: "DMSans_700Bold", fontSize: 14 }}>Pengajuan Ditolak</Text>
                </View>
                <Text className="text-xs text-mute leading-5">
                  {loan.review_note
                    ? `Alasan: ${loan.review_note}`
                    : "Pengajuan kamu tidak memenuhi kriteria penilaian saat ini. Kamu bisa mengajukan kembali setelah meningkatkan profil kreditmu."}
                </Text>
              </View>
            )}

            {isClosed && (
              <View style={{ backgroundColor: "rgba(74,222,128,0.08)", borderWidth: 1, borderColor: "rgba(74,222,128,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <View className="flex-row items-center gap-sm mb-xs">
                  <Ionicons name="checkmark-done-circle" size={18} color="#4ade80" />
                  <Text style={{ color: "#4ade80", fontFamily: "DMSans_700Bold", fontSize: 14 }}>Pinjaman Lunas</Text>
                </View>
                <Text className="text-xs text-mute leading-5">
                  Selamat! Pinjaman ini telah dilunasi. Riwayat pembayaran yang baik meningkatkan skor kreditmu.
                </Text>
              </View>
            )}

            {/* ── ML score ── */}
            {loan.confidence != null && !isRejected && (
              <Card variant="sage" className="mb-lg">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-body">ML Confidence Score</Text>
                  <Text className="text-sm font-sans-semibold text-ink">{Math.round(loan.confidence * 100)}%</Text>
                </View>
                {loan.review_note && !isRejected && (
                  <Text className="text-xs text-body mt-sm">Catatan: {loan.review_note}</Text>
                )}
              </Card>
            )}

            {/* ── Repayment ── */}
            {!isRejected && (
              <>
                <Text className="text-base font-sans-semibold text-ink mb-sm">Tagihan</Text>
                {(loan.repayments ?? []).length === 0 ? (
                  <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 20 }}>
                    <Text className="text-sm text-mute text-center">
                      {isApproved ? "Tagihan dibuat setelah kamu menerima penawaran"
                        : isManualReview ? "Menunggu hasil tinjauan admin"
                        : "Belum ada tagihan"}
                    </Text>
                  </View>
                ) : (() => {
                  const rep = loan.repayments![0];
                  const isOverdue = !rep.paid_at && new Date(rep.due_date) < new Date();
                  const daysLeft = Math.ceil((new Date(rep.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <View style={{
                      borderRadius: 12, padding: 16,
                      backgroundColor: rep.paid_at ? "rgba(74,222,128,0.08)" : isOverdue ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: rep.paid_at ? "rgba(74,222,128,0.2)" : isOverdue ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)",
                    }}>
                      <View className="flex-row items-center justify-between mb-md">
                        <View>
                          <Text className="text-xs text-mute mb-xxs">Total tagihan</Text>
                          <Text className="text-2xl font-sans-black text-ink">{formatIDR(rep.amount + rep.penalty)}</Text>
                          {rep.penalty > 0 && <Text className="text-xs text-negative mt-xxs">Termasuk denda {formatIDR(rep.penalty)}</Text>}
                        </View>
                        <View style={{
                          width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center",
                          backgroundColor: rep.paid_at ? "rgba(74,222,128,0.15)" : isOverdue ? "rgba(248,113,113,0.15)" : "rgba(159,232,112,0.15)",
                        }}>
                          <Ionicons
                            name={rep.paid_at ? "checkmark-circle" : isOverdue ? "warning" : "time-outline"}
                            size={24}
                            color={rep.paid_at ? "#4ade80" : isOverdue ? "#f87171" : "#9fe870"}
                          />
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between py-sm border-t border-ink/10">
                        <View>
                          <Text className="text-xs text-mute">Jatuh tempo</Text>
                          <Text className="text-sm font-sans-semibold text-ink">
                            {new Date(rep.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </Text>
                        </View>
                        {rep.paid_at ? (
                          <Text style={{ color: "#4ade80", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                            Dibayar {new Date(rep.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </Text>
                        ) : (
                          <Text style={{ color: isOverdue ? "#f87171" : daysLeft <= 7 ? "#ffd11a" : "#868685", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                            {isOverdue ? `Terlambat ${Math.abs(daysLeft)} hari` : daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}
                          </Text>
                        )}
                      </View>
                      {!rep.paid_at && (
                        <TouchableOpacity
                          onPress={() => setSelectedRepayment(rep)}
                          activeOpacity={0.8}
                          style={{ marginTop: 12, borderRadius: 10, paddingVertical: 14, alignItems: "center", backgroundColor: isOverdue ? "#f87171" : "#9fe870" }}
                        >
                          <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: isOverdue ? "#fff" : "#0e0f0c" }}>Bayar Sekarang</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </>
            )}
          </ScrollView>
        )}

        <AcceptOfferModal
          visible={showAcceptModal}
          loanId={loanId}
          monthly={(loan?.monthly_installment ?? 0) * (loan?.tenure_months ?? 1)}
          onClose={() => setShowAcceptModal(false)}
          onSuccess={handleAcceptSuccess}
          onError={(msg) => show(msg, "error")}
        />
        <PaymentModal
          repayment={selectedRepayment}
          loanId={loanId}
          onClose={() => setSelectedRepayment(null)}
          onSuccess={handlePaySuccess}
          onError={(msg) => show(msg, "error")}
        />
        <Toast {...toast} onHide={hide} />
      </Animated.View>
    </View>
  );
}
