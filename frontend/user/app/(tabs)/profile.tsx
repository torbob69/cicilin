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
import { useToast, Toast } from "@/components/ui/Toast";
import { RANK_XP, RANK_LIMIT, RANK_RATE } from "@/constants/config";
import { rankColors } from "@/constants/colors";

const MAX_LIMIT = 100_000_000; // Ruby

function formatIDR(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="flex-row justify-between py-md border-b border-ink/5">
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
  annual_income: number | null;
}

// ── Edit Sheet ────────────────────────────────────────────────────────────────

function EditSheet({
  visible,
  initial,
  address,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: Employment;
  address: string;
  onClose: () => void;
  onSave: (address: string, emp: Partial<Employment>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    address,
    occupation: initial.occupation ?? "",
    employer_name: initial.employer_name ?? "",
    annual_income: initial.annual_income ? String(initial.annual_income) : "",
  });
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setForm({
        address,
        occupation: initial.occupation ?? "",
        employer_name: initial.employer_name ?? "",
        annual_income: initial.annual_income ? String(initial.annual_income) : "",
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
        annual_income: form.annual_income ? Number(form.annual_income) : null,
      });
      onClose();
    } finally {
      setSaving(false);
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
          <Text className="text-lg font-sans-black text-ink mb-xl">Edit Informasi</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-lg pb-lg">
              <Input label="Alamat" placeholder="Alamat lengkap" multiline numberOfLines={2}
                value={form.address} onChangeText={set("address")} />
              <Input label="Pekerjaan" placeholder="e.g. Software Engineer"
                value={form.occupation} onChangeText={set("occupation")} />
              <Input label="Perusahaan" placeholder="e.g. PT. Contoh Indonesia"
                value={form.employer_name} onChangeText={set("employer_name")} />
              <Input label="Penghasilan Tahunan (IDR)" placeholder="e.g. 72000000"
                keyboardType="number-pad"
                value={form.annual_income} onChangeText={set("annual_income")} />
            </View>
          </ScrollView>

          <View className="gap-sm">
            <Button label={saving ? "Menyimpan…" : "Simpan"} loading={saving} onPress={handleSave} />
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
  const [employment, setEmployment] = useState<Employment>({
    occupation: null, employer_name: null, job_title: null, annual_income: null,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [usedLimit, setUsedLimit] = useState(0);

  const load = async () => {
    try {
      const [rankRes, empRes, loansRes] = await Promise.all([
        userService.getRank(),
        userService.getEmployment(),
        loanService.list("approved"),
      ]);
      setRankData(rankRes.data);
      setEmployment(empRes.data);
      const now = new Date();
      const used = (loansRes.data ?? [])
        .filter((l: any) => {
          const d = new Date(l.created_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .reduce((sum: number, l: any) => sum + (l.loan_amnt ?? 0), 0);
      setUsedLimit(used);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (address: string, emp: Partial<Employment>) => {
    try {
      await Promise.all([
        userService.updateMe({ address }),
        userService.updateEmployment({
          occupation: emp.occupation ?? "",
          employer_name: emp.employer_name ?? "",
          job_title: employment.job_title ?? "",
          emp_length: 0,
          annual_income: emp.annual_income ?? 0,
        }),
      ]);
      await Promise.all([fetchProfile(), load()]);
      show("Profil diperbarui", "success");
    } catch (err: any) {
      show(err?.response?.data?.detail ?? "Gagal menyimpan", "error");
      throw err;
    }
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
  const colors = rankColors[rank] ?? { bg: "#161915", text: "#9fe870" };

  // XP bar: progress within current rank tier
  const [xpMin, xpMax] = RANK_XP[rank] ?? [0, 100];
  const xpPct = xpMax === Infinity ? 1 : Math.min(xp / xpMax, 1);
  const xpToNext = rankData?.xp_to_next_rank;

  // Monthly limit bar: used this month vs total rank limit
  const limitPct = monthlyLimit > 0 ? Math.min(usedLimit / monthlyLimit, 1) : 0;

  const [barWidth, setBarWidth] = useState(0);

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Hero card ── */}
        <View style={{ backgroundColor: colors.bg, paddingTop: insets.top + 24, paddingBottom: 0 }}>
          {/* Name row */}
          <View className="px-xl flex-row items-center justify-between mb-xl">
            <View>
              <Text style={{ color: colors.text, opacity: 0.7 }} className="text-xs font-sans-medium uppercase tracking-wider">
                Profil Saya
              </Text>
              <Text style={{ color: colors.text }} className="text-xl font-sans-black mt-xxs">
                {user?.full_name ?? "—"}
              </Text>
              <Text style={{ color: colors.text, opacity: 0.6 }} className="text-sm mt-xxs">
                {user?.phone}
              </Text>
            </View>
            <RankBadge rank={rank} size={64} />
          </View>

          {/* Rank label */}
          <View className="px-xl mb-lg">
            <View className="flex-row items-center gap-sm">
              <Text style={{ color: colors.text }} className="text-3xl font-sans-black">{rank}</Text>
            </View>
          </View>

          {/* Progress bars */}
          <View className="px-xl pb-xl gap-lg">
            {/* XP bar */}
            <View className="gap-xs">
              <View className="flex-row justify-between">
                <Text style={{ color: colors.text, opacity: 0.7 }} className="text-xs font-sans-medium">XP</Text>
                <Text style={{ color: colors.text, opacity: 0.7 }} className="text-xs">
                  {xp.toLocaleString("id-ID")} / {xpMax === Infinity ? "Max" : `${xpMax.toLocaleString("id-ID")} XP`}
                </Text>
              </View>
              <View
                style={{ backgroundColor: "rgba(0,0,0,0.2)", height: 8, borderRadius: 9999, overflow: "hidden" }}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              >
                <View style={{ width: Math.max(xpPct * barWidth, barWidth > 0 ? 4 : 0), height: 8, borderRadius: 9999, backgroundColor: colors.text }} />
              </View>
            </View>

            {/* Monthly limit bar */}
            <View className="gap-xs">
              <View className="flex-row justify-between">
                <Text style={{ color: colors.text, opacity: 0.7 }} className="text-xs font-sans-medium">Limit Bulanan</Text>
                <Text style={{ color: colors.text, opacity: 0.7 }} className="text-xs">
                  {formatIDR(usedLimit)} / {formatIDR(monthlyLimit)}
                </Text>
              </View>
              <View style={{ backgroundColor: "rgba(0,0,0,0.2)", height: 8, borderRadius: 9999, overflow: "hidden" }}>
                <View style={{ width: Math.max(limitPct * barWidth, barWidth > 0 ? 4 : 0), height: 8, borderRadius: 9999, backgroundColor: colors.text, opacity: 0.7 }} />
              </View>
            </View>

            {/* Interest rate */}
            <Text style={{ color: colors.text, opacity: 0.6 }} className="text-xs">
              Bunga {rate}% p.a. · Pembayaran sekali di akhir tenor
            </Text>
          </View>
        </View>

        {/* ── Personal info (read-only) ── */}
        <View className="px-xl mt-xl mb-lg">
          <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider mb-sm">
            Informasi Pribadi
          </Text>
          <View className="bg-canvas rounded-xl px-lg">
            <InfoRow label="Nama Lengkap" value={user?.full_name} />
            <InfoRow label="Nomor HP" value={user?.phone} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="NIK" value={user?.nik ?? "Belum diisi"} />
            <InfoRow
              label="Tanggal Lahir"
              value={user?.date_of_birth
                ? new Date(user.date_of_birth).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : undefined}
            />
          </View>
        </View>

        {/* ── Editable section ── */}
        <View className="px-xl mb-lg">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-xs font-sans-semibold text-mute uppercase tracking-wider">
              Pekerjaan & Keuangan
            </Text>
            <TouchableOpacity
              onPress={() => setEditOpen(true)}
              className="flex-row items-center gap-xs"
            >
              <Ionicons name="pencil-outline" size={13} color="#9fe870" />
              <Text className="text-xs font-sans-semibold text-primary">Edit</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-canvas rounded-xl px-lg">
            <InfoRow label="Alamat" value={user?.address} />
            <InfoRow label="Pekerjaan" value={employment.occupation} />
            <InfoRow label="Perusahaan" value={employment.employer_name} />
            <InfoRow
              label="Penghasilan Tahunan"
              value={employment.annual_income
                ? `Rp ${Number(employment.annual_income).toLocaleString("id-ID")}`
                : undefined}
            />
          </View>
        </View>

        {/* ── Sign out ── */}
        <View className="px-xl">
          <Pressable
            onPress={() => setLogoutOpen(true)}
            disabled={loggingOut}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: "#f87171",
              borderRadius: 9999,
              padding: 16,
              alignItems: "center",
              backgroundColor: pressed ? "#f87171" : "transparent",
            })}
          >
            {({ pressed }) => (
              <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: pressed ? "#0e0f0c" : "#f87171" }}>
                Log out
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <EditSheet
        visible={editOpen}
        initial={employment}
        address={user?.address ?? ""}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <Toast {...toast} onHide={hide} />

      {/* Logout confirmation overlay */}
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)} statusBarTranslucent>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => setLogoutOpen(false)}
        >
          <Pressable onPress={() => {}} style={{ width: "100%", backgroundColor: "#161915", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ fontSize: 18, fontFamily: "DMSans_700Bold", color: "#e8ebe6", marginBottom: 8 }}>Keluar</Text>
            <Text style={{ fontSize: 14, fontFamily: "DMSans_400Regular", color: "#525550", marginBottom: 24 }}>
              Yakin ingin keluar dari akun ini?
            </Text>
            <View style={{ gap: 8 }}>
              <Pressable
                onPress={doLogout}
                disabled={loggingOut}
                style={({ pressed }) => ({ backgroundColor: pressed ? "#dc2626" : "#f87171", borderRadius: 12, padding: 14, alignItems: "center" })}
              >
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#fff" }}>
                  {loggingOut ? "Keluar…" : "Keluar"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLogoutOpen(false)}
                style={({ pressed }) => ({ backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "transparent", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" })}
              >
                <Text style={{ fontSize: 14, fontFamily: "DMSans_600SemiBold", color: "#525550" }}>Batal</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function _nextRankName(rank: string): string {
  const order = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"];
  const i = order.indexOf(rank);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : "Ruby";
}
