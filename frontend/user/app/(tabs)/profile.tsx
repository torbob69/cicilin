import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { userService } from "@/services/users";
import { loanService } from "@/services/loans";
import { RankBadge } from "@/components/RankBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { useToast, Toast } from "@/components/ui/Toast";
import { RANK_XP, RANK_LIMIT, RANK_RATE } from "@/constants/config";
import { parseApiError } from "@/utils/api";

function formatIDR(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

function InfoRow({ label, value, isLast }: { label: string; value?: string | number | null; isLast?: boolean }) {
  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.06)" }} className="flex-row justify-between py-md">
      <Text className="text-sm text-mute">{label}</Text>
      <Text className="text-sm font-sans-semibold text-ink flex-1 text-right ml-lg" numberOfLines={1}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

interface Employment {
  occupation: string | null;
  employer_name: string | null;
  job_title: string | null;
  emp_length: number | null;
  annual_income: number | null;
}

// ── Edit Sheet ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: "DMSans_600SemiBold", color: "#525550", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>
      {children}
    </Text>
  );
}

function EditSheet({ visible, initial, address, onClose, onSave }: {
  visible: boolean; initial: Employment; address: string;
  onClose: () => void; onSave: (address: string, emp: Employment) => Promise<void>;
}) {
  const [form, setForm] = useState({
    address: address,
    occupation: initial.occupation ?? "",
    employer_name: initial.employer_name ?? "",
    job_title: initial.job_title ?? "",
    emp_length: initial.emp_length != null ? String(initial.emp_length) : "",
    annual_income: initial.annual_income != null ? String(initial.annual_income) : "",
  });
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setForm({
        address,
        occupation: initial.occupation ?? "",
        employer_name: initial.employer_name ?? "",
        job_title: initial.job_title ?? "",
        emp_length: initial.emp_length != null ? String(initial.emp_length) : "",
        annual_income: initial.annual_income != null ? String(initial.annual_income) : "",
      });
    }
  }, [visible]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form.address, {
        occupation: form.occupation || null,
        employer_name: form.employer_name || null,
        job_title: form.job_title || null,
        emp_length: form.emp_length ? Number(form.emp_length) : null,
        annual_income: form.annual_income ? Number(form.annual_income) : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-canvas rounded-t-3xl px-xl pt-xl" style={{ paddingBottom: insets.bottom + 24, maxHeight: "90%" }}>
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />
          <Text className="text-lg font-sans-black text-ink mb-xl">Edit Pekerjaan & Keuangan</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="pb-lg gap-xs">

              <SectionLabel>Alamat Tinggal</SectionLabel>
              <Input
                label="Alamat"
                placeholder="Alamat lengkap"
                multiline
                numberOfLines={2}
                value={form.address}
                onChangeText={set("address")}
              />

              <SectionLabel>Pekerjaan</SectionLabel>
              <Input
                label="Profesi"
                placeholder="cth. Software Engineer"
                value={form.occupation}
                onChangeText={set("occupation")}
              />
              <Input
                label="Nama Perusahaan"
                placeholder="cth. PT. Contoh Indonesia"
                value={form.employer_name}
                onChangeText={set("employer_name")}
              />
              <Input
                label="Jabatan"
                placeholder="cth. Senior Developer"
                value={form.job_title}
                onChangeText={set("job_title")}
              />
              <Input
                label="Lama Bekerja (tahun)"
                placeholder="cth. 3"
                keyboardType="decimal-pad"
                value={form.emp_length}
                onChangeText={set("emp_length")}
              />

              <SectionLabel>Keuangan</SectionLabel>
              <Input
                label="Penghasilan Tahunan (IDR)"
                placeholder="cth. 72000000"
                keyboardType="number-pad"
                value={form.annual_income}
                onChangeText={set("annual_income")}
                hint="Penghasilan kotor sebelum pajak"
              />

            </View>
          </ScrollView>
          <View className="gap-sm pt-md">
            <Button label={saving ? "Menyimpan…" : "Simpan"} loading={saving} onPress={handleSave} />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pin Sheet ─────────────────────────────────────────────────────────────────

function PinSheet({ visible, hasPinSet, onClose, onSave }: {
  visible: boolean;
  hasPinSet: boolean;
  onClose: () => void;
  onSave: (currentPin: string | null, newPin: string) => Promise<void>;
}) {
  const [currentPin, setCurrentPin] = useState("      ");
  const [newPin, setNewPin] = useState("      ");
  const [confirmPin, setConfirmPin] = useState("      ");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setCurrentPin("      ");
      setNewPin("      ");
      setConfirmPin("      ");
      setError(null);
    }
  }, [visible]);

  const handleSave = async () => {
    const cp = currentPin.trim();
    const np = newPin.trim();
    const cnp = confirmPin.trim();
    if (hasPinSet && cp.length < 6) { setError("Masukkan PIN saat ini (6 digit)"); return; }
    if (np.length < 6) { setError("Masukkan PIN baru (6 digit)"); return; }
    if (np !== cnp) { setError("Konfirmasi PIN baru tidak cocok"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(hasPinSet ? cp : null, np);
      onClose();
    } catch (err: any) {
      setError(parseApiError(err, "Gagal menyimpan PIN"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-canvas rounded-t-3xl px-xl pt-xl" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="w-10 h-1 bg-ink/20 rounded-pill self-center mb-xl" />
          <Text className="text-lg font-sans-black text-ink mb-xs">
            {hasPinSet ? "Ganti PIN" : "Buat PIN"}
          </Text>
          <Text className="text-sm text-mute mb-2xl">
            {hasPinSet
              ? "Masukkan PIN lama dan PIN baru kamu."
              : "Buat PIN 6 digit untuk keamanan akunmu."}
          </Text>

          <View className="gap-2xl">
            {hasPinSet && (
              <View>
                <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-lg text-center">PIN Saat Ini</Text>
                <OtpInput value={currentPin} onChange={setCurrentPin} secureTextEntry />
              </View>
            )}
            <View>
              <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-lg text-center">PIN Baru</Text>
              <OtpInput value={newPin} onChange={setNewPin} secureTextEntry />
            </View>
            <View>
              <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-lg text-center">Konfirmasi PIN Baru</Text>
              <OtpInput value={confirmPin} onChange={setConfirmPin} secureTextEntry />
            </View>
          </View>

          {error ? (
            <Text style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginTop: 16 }}>{error}</Text>
          ) : null}

          <View className="gap-sm mt-2xl">
            <Button
              label={saving ? "Menyimpan…" : hasPinSet ? "Simpan PIN Baru" : "Buat PIN"}
              loading={saving}
              onPress={handleSave}
            />
            <Button label="Batal" variant="tertiary" onPress={onClose} disabled={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, fetchProfile, logout } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [rankData, setRankData] = useState<any>(null);
  const [employment, setEmployment] = useState<Employment>({ occupation: null, employer_name: null, job_title: null, emp_length: null, annual_income: null });
  const [kycStatus, setKycStatus] = useState<{ review_status: string; rejection_reason: string | null } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [usedLimit, setUsedLimit] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  const load = async () => {
    try {
      const [rankRes, empRes, loansRes, kycRes] = await Promise.all([
        userService.getRank(),
        userService.getEmployment(),
        loanService.list("approved"),
        userService.getKycStatus(),
      ]);
      setRankData(rankRes.data);
      setEmployment(empRes.data);
      setKycStatus(kycRes.data);
      const now = new Date();
      const used = (loansRes.data ?? [])
        .filter((l: any) => { const d = new Date(l.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); })
        .reduce((sum: number, l: any) => sum + (l.loan_amnt ?? 0), 0);
      setUsedLimit(used);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (address: string, emp: Employment) => {
    try {
      await Promise.all([
        userService.updateMe({ address }),
        userService.updateEmployment({
          occupation: emp.occupation ?? "",
          employer_name: emp.employer_name ?? "",
          job_title: emp.job_title ?? "",
          emp_length: emp.emp_length ?? 0,
          annual_income: emp.annual_income ?? 0,
        }),
      ]);
      await Promise.all([fetchProfile(), load()]);
      show("Profil diperbarui", "success");
    } catch (err: any) {
      show(parseApiError(err, "Gagal menyimpan"), "error");
      throw err;
    }
  };

  const handlePinSave = async (currentPin: string | null, newPin: string) => {
    if (currentPin === null) {
      await userService.setPin(newPin);
      show("PIN berhasil dibuat", "success");
    } else {
      await userService.changePin({ current_pin: currentPin, new_pin: newPin });
      show("PIN berhasil diubah", "success");
    }
    await fetchProfile();
  };

  const doLogout = async () => {
    setLoggingOut(true);
    setLogoutOpen(false);
    await logout();
    router.replace("/(auth)/login");
  };

  const rank = rankData?.rank ?? user?.rank ?? "Gold";
  const xp = rankData?.xp ?? user?.xp ?? 0;
  const rate = rankData?.interest_rate ?? RANK_RATE[rank] ?? 15;
  const monthlyLimit = rankData?.monthly_limit ?? RANK_LIMIT[rank] ?? 0;
  const [xpMin, xpMax] = RANK_XP[rank] ?? [0, 100];
  const xpPct = xpMax === Infinity ? 1 : Math.min((xp - xpMin) / (xpMax - xpMin), 1);
  const limitPct = monthlyLimit > 0 ? Math.min(usedLimit / monthlyLimit, 1) : 0;
  const firstName = user?.full_name?.split(" ")[0] ?? "—";
  const cardId = `${rank[0]} ${rank[0]} ${(user?.id ?? 0).toString().padStart(4, "0").slice(-4)}`;

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Header ── */}
        <View style={{ paddingTop: insets.top + 48 }} className="px-xl pb-lg">
          <Text style={{ fontFamily: "PixelifySans_400Regular", fontSize: 24, color: "#e8ebe6" }}>{firstName}</Text>
          <Text className="text-sm text-mute">{user?.phone}</Text>
        </View>

        {/* ── Rank card ── */}
        <View className="mx-xl mb-xl">
          <View style={{ backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <RankBadge rank={rank} size={48} />
              <View className="flex-1">
                <Text style={{ color: "#fff", fontSize: 18, fontFamily: "DMSans_700Bold" }}>{rank}</Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "DMSans_400Regular" }}>Bunga {rate}%</Text>
              </View>
            </View>

            {/* XP bar */}
            <View className="mb-md">
              <View className="flex-row justify-between mb-xs">
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>XP</Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  {xp.toLocaleString("id-ID")} / {xpMax === Infinity ? "Max" : xpMax.toLocaleString("id-ID")}
                </Text>
              </View>
              <View
                style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              >
                <View style={{ width: Math.max(xpPct * barWidth, barWidth > 0 ? 3 : 0), height: 4, borderRadius: 99, backgroundColor: "#9fe870" }} />
              </View>
            </View>

            {/* Limit bar */}
            <View>
              <View className="flex-row justify-between mb-xs">
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Limit Bulanan</Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  {formatIDR(usedLimit)} / {formatIDR(monthlyLimit)}
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <View style={{ width: Math.max(limitPct * barWidth, barWidth > 0 ? 3 : 0), height: 4, borderRadius: 99, backgroundColor: "#9fe870", opacity: 0.6 }} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Personal info ── */}
        <View className="px-xl mb-xl">
          <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-sm">Informasi Pribadi</Text>
          <InfoRow label="Nama Lengkap" value={user?.full_name} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="NIK" value={user?.nik ?? "Belum diisi"} />
          <InfoRow label="Tanggal Lahir" value={user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined} isLast />
        </View>

        {/* ── Employment & Financial ── */}
        <View className="px-xl mb-xl">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider">Pekerjaan & Keuangan</Text>
            <TouchableOpacity onPress={() => setEditOpen(true)} className="flex-row items-center gap-xs">
              <Ionicons name="pencil-outline" size={13} color="#9fe870" />
              <Text className="text-xs font-sans-semibold text-primary">Edit</Text>
            </TouchableOpacity>
          </View>
          <InfoRow label="Alamat" value={user?.address} />
          <InfoRow label="Profesi" value={employment.occupation} />
          <InfoRow label="Perusahaan" value={employment.employer_name} />
          <InfoRow label="Jabatan" value={employment.job_title} />
          <InfoRow label="Lama Bekerja" value={employment.emp_length != null ? `${employment.emp_length} tahun` : undefined} />
          <InfoRow
            label="Penghasilan Tahunan"
            value={employment.annual_income != null ? `Rp ${Number(employment.annual_income).toLocaleString("id-ID")}` : undefined}
            isLast
          />
        </View>

        {/* ── Keamanan ── */}
        <View className="px-xl mb-xl">
          <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-sm">Keamanan</Text>

          {/* KYC row — only when not yet approved */}
          {kycStatus && kycStatus.review_status !== "approved" && (
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/documents")}
              className="flex-row justify-between items-center py-md"
              style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}
            >
              <View className="flex-row items-center gap-sm">
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={kycStatus.review_status === "rejected" ? "#f87171" : "#525550"}
                />
                <View>
                  <Text className="text-sm text-ink">
                    {kycStatus.review_status === "rejected" ? "Upload Ulang KYC" : "Upload Dokumen KYC"}
                  </Text>
                  {kycStatus.review_status === "rejected" && kycStatus.rejection_reason ? (
                    <Text style={{ fontSize: 11, color: "#f87171" }} numberOfLines={1}>
                      {kycStatus.rejection_reason}
                    </Text>
                  ) : kycStatus.review_status === "pending" ? (
                    <Text style={{ fontSize: 11, color: "#525550" }}>Upload KTP, KK, dan dokumen penting lain</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={kycStatus.review_status === "rejected" ? "#f87171" : "#525550"}
              />
            </TouchableOpacity>
          )}

          {/* PIN row */}
          <TouchableOpacity
            onPress={() => setPinOpen(true)}
            className="flex-row justify-between items-center py-md"
          >
            <View className="flex-row items-center gap-sm">
              <Ionicons name="lock-closed-outline" size={16} color="#525550" />
              <Text className="text-sm text-ink">{user?.has_pin ? "Ganti PIN" : "Buat PIN"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#525550" />
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <View className="px-xl">
          <Pressable
            onPress={() => setLogoutOpen(true)}
            disabled={loggingOut}
            style={({ pressed }) => ({ borderWidth: 1, borderColor: "#f87171", borderRadius: 9999, padding: 16, alignItems: "center", backgroundColor: pressed ? "#f87171" : "transparent" })}
          >
            {({ pressed }) => (
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: pressed ? "#0e0f0c" : "#f87171" }}>Log out</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <EditSheet visible={editOpen} initial={employment} address={user?.address ?? ""} onClose={() => setEditOpen(false)} onSave={handleSave} />
      <PinSheet visible={pinOpen} hasPinSet={user?.has_pin ?? false} onClose={() => setPinOpen(false)} onSave={handlePinSave} />
      <Toast {...toast} onHide={hide} />

      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }} onPress={() => setLogoutOpen(false)}>
          <Pressable onPress={() => {}} style={{ width: "100%", backgroundColor: "#161915", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: "#e8ebe6", marginBottom: 8 }}>Keluar</Text>
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: "#525550", marginBottom: 24 }}>Yakin ingin keluar dari akun ini?</Text>
            <View style={{ gap: 8 }}>
              <Pressable onPress={doLogout} disabled={loggingOut} style={({ pressed }) => ({ backgroundColor: pressed ? "#dc2626" : "#f87171", borderRadius: 12, padding: 14, alignItems: "center" })}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>{loggingOut ? "Keluar…" : "Keluar"}</Text>
              </Pressable>
              <Pressable onPress={() => setLogoutOpen(false)} style={({ pressed }) => ({ backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "transparent", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" })}>
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#525550" }}>Batal</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
