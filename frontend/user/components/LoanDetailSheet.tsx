import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import QRCode from "react-native-qrcode-svg";
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
        behavior="padding"
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
            <Text className="text-xs text-mute mt-xxs">Dibayar sesuai jadwal cicilan bulanan</Text>
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

// ── Payment Modal (2-step VA / QRIS flow) ─────────────────────────────────────

interface PaymentResult { xp_gained: number; new_rank: string; loan_closed: boolean; }

function generateVA(): string {
  // Prefix "8877" followed by 12 random digits (total 16 digits)
  let digits = "";
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return "8877" + digits;
}

type PayStep = "details" | "confirm";

function PaymentModal({
  repayment, loanId, installmentNumber, onClose, onCancel, onSuccess, onError, onPaymentInitiated,
}: {
  repayment: Repayment | null; loanId: number; installmentNumber: number;
  onClose: () => void; onCancel: () => void; onSuccess: (r: PaymentResult) => Promise<void>; onError: (msg: string) => void;
  onPaymentInitiated: () => void;
}) {
  const [step, setStep] = useState<PayStep>("details");
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [vaNumber] = useState(() => generateVA());
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const total = repayment ? repayment.amount + repayment.penalty : 0;
  const isOverdue = repayment ? !repayment.paid_at && new Date(repayment.due_date) < new Date() : false;

  // QRIS value: fake-but-realistic QRIS string
  const qrisValue = `CICILIN-VA-${vaNumber}-AMT-${Math.round(total)}`;

  const handleClose = () => {
    if (payingRef.current) return; // block dismiss while payment is in-flight
    setStep("details");
    setSelectedBank(null);
    onClose();
  };

  const handleConfirmPayment = () => {
    if (!repayment || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);

    // Fire the API in the background — the user is being navigated away
    // immediately so they physically cannot tap this button again.
    const repaymentId = repayment.id;
    loanService
      .payInstallment(loanId, repaymentId)
      .then((res) => onSuccess(res.data))
      .catch((err: any) => {
        onError(err?.response?.data?.detail ?? "Pembayaran gagal");
      });

    // Close modal + sheet + navigate home right now, before the API resolves.
    onPaymentInitiated();
  };

  const BANKS = ["BCA", "Mandiri", "BNI"];

  // Format VA number with spaces for readability: 8877 xxxx xxxx xxxx
  const vaFormatted = vaNumber.replace(/(.{4})/g, "$1 ").trim();

  return (
    <Modal visible={!!repayment} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <View
          style={{
            backgroundColor: "#161915",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 99, alignSelf: "center", marginBottom: 20 }} />

          {step === "details" ? (
            <>
              {/* Step 1 — Payment details & method selection */}
              <Text style={{ color: "#e8ebe6", fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 4 }}>
                Pilih Metode Pembayaran
              </Text>
              <Text style={{ color: "#525550", fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 20 }}>
                Cicilan ke-{installmentNumber} · jatuh tempo{" "}
                {repayment
                  ? new Date(repayment.due_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </Text>

              {/* Amount summary */}
              <View
                style={{
                  backgroundColor: "#1e211d",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#868685", fontSize: 13, fontFamily: "DMSans_400Regular" }}>Pokok cicilan</Text>
                  <Text style={{ color: "#e8ebe6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                    {repayment ? formatIDR(repayment.amount) : "—"}
                  </Text>
                </View>
                {repayment && repayment.penalty > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#f87171", fontSize: 13, fontFamily: "DMSans_400Regular" }}>Denda keterlambatan</Text>
                    <Text style={{ color: "#f87171", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                      +{formatIDR(repayment.penalty)}
                    </Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#e8ebe6", fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>Total dibayar</Text>
                  <Text style={{ color: "#e8ebe6", fontSize: 16, fontFamily: "DMSans_700Bold" }}>{formatIDR(total)}</Text>
                </View>
              </View>

              {isOverdue && (
                <View
                  style={{
                    backgroundColor: "rgba(248,113,113,0.08)",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="warning-outline" size={15} color="#f87171" />
                  <Text style={{ color: "#f87171", fontSize: 12, fontFamily: "DMSans_400Regular", flex: 1 }}>
                    Cicilan ini terlambat. Denda telah ditambahkan.
                  </Text>
                </View>
              )}

              {/* Virtual Account section */}
              <Text style={{ color: "#e8ebe6", fontSize: 14, fontFamily: "DMSans_600SemiBold", marginBottom: 10 }}>
                Virtual Account
              </Text>
              {/* Bank options */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    onPress={() => setSelectedBank(bank)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selectedBank === bank ? "#9fe870" : "rgba(255,255,255,0.1)",
                      backgroundColor: selectedBank === bank ? "rgba(159,232,112,0.08)" : "#1e211d",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: selectedBank === bank ? "#9fe870" : "#868685",
                        fontSize: 13,
                        fontFamily: "DMSans_600SemiBold",
                      }}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* VA Number display */}
              {selectedBank && (
                <View
                  style={{
                    backgroundColor: "#1e211d",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: "rgba(159,232,112,0.2)",
                  }}
                >
                  <View>
                    <Text style={{ color: "#525550", fontSize: 10, fontFamily: "DMSans_400Regular", marginBottom: 3 }}>
                      Nomor Virtual Account {selectedBank}
                    </Text>
                    <Text style={{ color: "#e8ebe6", fontSize: 16, fontFamily: "DMSans_700Bold", letterSpacing: 1 }}>
                      {vaFormatted}
                    </Text>
                  </View>
                  <Ionicons name="copy-outline" size={18} color="#525550" />
                </View>
              )}

              {/* QRIS section */}
              <Text style={{ color: "#e8ebe6", fontSize: 14, fontFamily: "DMSans_600SemiBold", marginBottom: 10 }}>
                atau QRIS
              </Text>
              {/* Real QR code on white card */}
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <QRCode
                    value={qrisValue}
                    size={180}
                    backgroundColor="#ffffff"
                    color="#000000"
                  />
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      fontFamily: "DMSans_600SemiBold",
                      color: "#333333",
                      letterSpacing: 2,
                    }}
                  >
                    QRIS
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Button
                  label="Konfirmasi Pembayaran"
                  onPress={() => setStep("confirm")}
                />
                <Button label="Batal" variant="tertiary" onPress={handleClose} />
              </View>
            </>
          ) : (
            <>
              {/* Step 2 — Final confirmation before calling API */}
              <Text style={{ color: "#e8ebe6", fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 4 }}>
                Konfirmasi Pembayaran
              </Text>
              <Text style={{ color: "#525550", fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 20 }}>
                Pastikan detail pembayaran sudah benar.
              </Text>

              {/* Summary */}
              <View
                style={{
                  backgroundColor: "#1e211d",
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#868685", fontSize: 13 }}>Cicilan ke-</Text>
                  <Text style={{ color: "#e8ebe6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{installmentNumber}</Text>
                </View>
                {selectedBank && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#868685", fontSize: 13 }}>Bank</Text>
                    <Text style={{ color: "#e8ebe6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{selectedBank}</Text>
                  </View>
                )}
                {selectedBank && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#868685", fontSize: 13 }}>No. VA</Text>
                    <Text style={{ color: "#e8ebe6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{vaFormatted}</Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#e8ebe6", fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>Total Pembayaran</Text>
                  <Text style={{ color: "#9fe870", fontSize: 20, fontFamily: "DMSans_700Bold" }}>
                    {formatIDR(total)}
                  </Text>
                </View>
              </View>

              {isOverdue && (
                <View
                  style={{
                    backgroundColor: "rgba(248,113,113,0.08)",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="warning-outline" size={15} color="#f87171" />
                  <Text style={{ color: "#f87171", fontSize: 12, fontFamily: "DMSans_400Regular", flex: 1 }}>
                    Termasuk denda keterlambatan {formatIDR(repayment?.penalty ?? 0)}.
                  </Text>
                </View>
              )}

              <View style={{ gap: 8 }}>
                <Button
                  label="Bayar Sekarang"
                  onPress={handleConfirmPayment}
                  disabled={paying}
                  loading={paying}
                />
                <Button
                  label="Kembali"
                  variant="tertiary"
                  onPress={() => setStep("details")}
                  disabled={paying}
                />
              </View>
            </>
          )}
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

// ── Repayment row ─────────────────────────────────────────────────────────────

function RepaymentRow({
  rep,
  index,
  onPay,
}: {
  rep: Repayment;
  index: number;
  onPay: (rep: Repayment, installmentNumber: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(rep.due_date);
  due.setHours(0, 0, 0, 0);

  const isPaid = !!rep.paid_at;
  const isOverdue = !isPaid && due < today;
  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Border / background
  const bgColor = isPaid
    ? "rgba(74,222,128,0.07)"
    : isOverdue
    ? "rgba(248,113,113,0.07)"
    : "rgba(255,255,255,0.04)";
  const borderColor = isPaid
    ? "rgba(74,222,128,0.2)"
    : isOverdue
    ? "rgba(248,113,113,0.2)"
    : "rgba(255,255,255,0.06)";

  // Status label & color
  let statusLabel: string;
  let statusColor: string;
  if (isPaid) {
    statusLabel = "Lunas";
    statusColor = "#4ade80";
  } else if (isOverdue) {
    statusLabel = `Terlambat ${Math.abs(daysLeft)} hari`;
    statusColor = "#f87171";
  } else if (daysLeft === 0) {
    statusLabel = "Jatuh tempo hari ini";
    statusColor = "#ffd11a";
  } else if (daysLeft <= 7) {
    statusLabel = `${daysLeft} hari lagi`;
    statusColor = "#ffd11a";
  } else {
    statusLabel = `${daysLeft} hari lagi`;
    statusColor = "#868685";
  }

  const total = rep.amount + rep.penalty;

  return (
    <View
      style={{
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      {/* Top row: installment number + status badge */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Number chip */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isPaid
                ? "rgba(74,222,128,0.15)"
                : isOverdue
                ? "rgba(248,113,113,0.15)"
                : "rgba(159,232,112,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPaid ? (
              <Ionicons name="checkmark" size={14} color="#4ade80" />
            ) : (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "DMSans_700Bold",
                  color: isOverdue ? "#f87171" : "#9fe870",
                }}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={{ color: "#e8ebe6", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
            Cicilan ke-{index + 1}
          </Text>
        </View>

        {/* Status badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: isPaid
              ? "rgba(74,222,128,0.12)"
              : isOverdue
              ? "rgba(248,113,113,0.12)"
              : daysLeft <= 7
              ? "rgba(255,209,26,0.10)"
              : "rgba(255,255,255,0.06)",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 99,
          }}
        >
          <Text style={{ color: statusColor, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Middle row: amount + due date */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: rep.penalty > 0 ? 6 : 0 }}>
        <View>
          <Text style={{ color: "#868685", fontSize: 10, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>Jumlah tagihan</Text>
          <Text style={{ color: "#e8ebe6", fontSize: 17, fontFamily: "DMSans_700Bold" }}>
            {formatIDR(total)}
          </Text>
          {rep.penalty > 0 && (
            <Text style={{ color: "#f87171", fontSize: 10, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
              Denda {formatIDR(rep.penalty)} termasuk
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#868685", fontSize: 10, fontFamily: "DMSans_400Regular", marginBottom: 2 }}>Jatuh tempo</Text>
          <Text style={{ color: "#e8ebe6", fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
            {new Date(rep.due_date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          {isPaid && rep.paid_at && (
            <Text style={{ color: "#4ade80", fontSize: 10, fontFamily: "DMSans_400Regular", marginTop: 2 }}>
              Dibayar{" "}
              {new Date(rep.paid_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Bayar button — only for unpaid */}
      {!isPaid && (
        <TouchableOpacity
          onPress={() => onPay(rep, index + 1)}
          activeOpacity={0.8}
          style={{
            marginTop: 12,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: "center",
            backgroundColor: isOverdue ? "#f87171" : "#9fe870",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "DMSans_600SemiBold",
              color: isOverdue ? "#ffffff" : "#0e0f0c",
            }}
          >
            Bayar Sekarang
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────

export function LoanDetailSheet() {
  const { loanId, close } = useLoanSheet();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeLoan, fetchLoanDetail, fetchLoans, isLoading, clearActiveLoan } = useLoansStore();
  const { fetchProfile } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<Repayment | null>(null);
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState<number>(1);
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
      setSelectedRepayment(null);
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
    // Navigation already happened when the user tapped the button.
    // Refresh both profile (XP/rank) AND loans (so the home screen's
    // remaining-limit + next-due cards reflect the paid installment).
    const msg = result.loan_closed
      ? `Pinjaman lunas! +${result.xp_gained} XP · Rank: ${result.new_rank}`
      : `Pembayaran berhasil! +${result.xp_gained} XP · ${result.new_rank}`;
    show(msg, "success");
    fetchProfile();
    fetchLoans("all");
  };

  const handlePay = (rep: Repayment, installmentNumber: number) => {
    setSelectedInstallmentNumber(installmentNumber);
    setSelectedRepayment(rep);
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
  const repayments = loan?.repayments ?? [];
  const paidCount = repayments.filter((r) => r.paid_at).length;
  const totalCount = repayments.length;

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
                  <Text style={{ color: theme.color, opacity: 0.55, fontSize: 11 }}>Cicilan/bulan</Text>
                  <Text style={{ color: theme.color, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>{formatIDR(loan.monthly_installment)}</Text>
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
              {/* Repayment progress pill (only when repayments exist) */}
              {totalCount > 0 && (
                <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ flex: 1, height: 4, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 99 }}>
                    <View
                      style={{
                        height: 4,
                        borderRadius: 99,
                        backgroundColor: theme.color,
                        width: `${Math.round((paidCount / totalCount) * 100)}%`,
                      }}
                    />
                  </View>
                  <Text style={{ color: theme.color, fontSize: 11, fontFamily: "DMSans_600SemiBold" }}>
                    {paidCount}/{totalCount}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Status banners ── */}
            {isApproved && (
              <View style={{ backgroundColor: "rgba(159,232,112,0.1)", borderWidth: 1, borderColor: "rgba(159,232,112,0.25)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <View className="flex-row items-center gap-sm mb-sm">
                  <Ionicons name="checkmark-circle" size={18} color="#9fe870" />
                  <Text style={{ color: "#9fe870", fontFamily: "DMSans_700Bold", fontSize: 14 }}>Pinjaman Disetujui</Text>
                </View>
                <Text className="text-xs text-mute leading-5 mb-md">
                  Cicilan bulanan {formatIDR(loan.monthly_installment)} selama {loan.tenure_months} bulan. Konfirmasi dengan PIN untuk mencairkan dana.
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

            {/* ── Repayment schedule ── */}
            {!isRejected && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text className="text-base font-sans-semibold text-ink">
                    Jadwal Cicilan
                  </Text>
                  {totalCount > 0 && (
                    <Text style={{ color: "#525550", fontSize: 12, fontFamily: "DMSans_400Regular" }}>
                      {paidCount} dari {totalCount} lunas
                    </Text>
                  )}
                </View>

                {repayments.length === 0 ? (
                  <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 20 }}>
                    <Text className="text-sm text-mute text-center">
                      {isApproved
                        ? "Jadwal cicilan dibuat setelah kamu menerima penawaran"
                        : isManualReview
                        ? "Menunggu hasil tinjauan admin"
                        : "Belum ada jadwal cicilan"}
                    </Text>
                  </View>
                ) : (
                  repayments.map((rep, index) => (
                    <RepaymentRow
                      key={rep.id}
                      rep={rep}
                      index={index}
                      onPay={handlePay}
                    />
                  ))
                )}
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
          installmentNumber={selectedInstallmentNumber}
          onClose={() => setSelectedRepayment(null)}
          onCancel={() => setSelectedRepayment(null)}
          onSuccess={handlePaySuccess}
          onError={(msg) => show(msg, "error")}
          onPaymentInitiated={() => {
            setSelectedRepayment(null);
            close();
            router.replace("/(tabs)/");
          }}
        />
        <Toast {...toast} onHide={hide} />
      </Animated.View>
    </View>
  );
}
