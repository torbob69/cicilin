import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userService } from "@/services/users";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { HOME_OWNERSHIP_OPTIONS } from "@/constants/config";

export default function PersonalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({
    nik: "",
    date_of_birth: "",
    address: "",
    cb_person_cred_hist_length: "",
  });
  const [homeOwnership, setHomeOwnership] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form & { home_ownership: string }>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (form.nik.length !== 16) e.nik = "NIK harus 16 digit";
    if (!form.date_of_birth.match(/^\d{4}-\d{2}-\d{2}$/))
      e.date_of_birth = "Format: YYYY-MM-DD";
    if (!form.address.trim()) e.address = "Alamat wajib diisi";
    if (!homeOwnership) e.home_ownership = "Pilih status kepemilikan rumah";
    if (!form.cb_person_cred_hist_length || isNaN(Number(form.cb_person_cred_hist_length)))
      e.cb_person_cred_hist_length = "Masukkan lama riwayat kredit";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.updateMe({
        nik: form.nik,
        date_of_birth: form.date_of_birth,
        address: form.address,
        home_ownership: homeOwnership,
        cb_person_cred_hist_length: Number(form.cb_person_cred_hist_length),
      });
      router.push("/(onboarding)/employment");
    } catch (err: any) {
      show(err?.response?.data?.detail ?? "Gagal menyimpan", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas-soft"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
        className="px-xl"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-xl">
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        {/* Step indicator */}
        <View className="flex-row gap-xs mb-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              className={`h-1 flex-1 rounded-pill ${s === 1 ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Data Pribadi</Text>
        <Text className="text-sm text-body mb-2xl">Langkah 1 dari 5 — Diperlukan untuk KYC</Text>

        <View className="gap-lg">
          <Input
            label="NIK (16 digit)"
            placeholder="Nomor KTP kamu"
            keyboardType="number-pad"
            maxLength={16}
            value={form.nik}
            onChangeText={set("nik")}
            error={errors.nik}
          />
          <Input
            label="Tanggal Lahir"
            placeholder="YYYY-MM-DD"
            value={form.date_of_birth}
            onChangeText={set("date_of_birth")}
            error={errors.date_of_birth}
            hint="cth. 1995-08-17"
          />
          <Input
            label="Alamat"
            placeholder="Alamat lengkap"
            multiline
            numberOfLines={3}
            value={form.address}
            onChangeText={set("address")}
            error={errors.address}
          />

          {/* Home ownership selector */}
          <View className="gap-xs">
            <Text className="text-sm font-sans-semibold text-ink">Status Kepemilikan Rumah</Text>
            <View className="flex-row flex-wrap gap-sm">
              {HOME_OWNERSHIP_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setHomeOwnership(opt.value)}
                  className={`px-lg py-sm rounded-xl border ${
                    homeOwnership === opt.value
                      ? "bg-canvas border-primary"
                      : "bg-canvas-soft border-white/[0.06]"
                  }`}
                >
                  <Text
                    className={`text-sm font-sans-semibold ${
                      homeOwnership === opt.value ? "text-primary" : "text-mute"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.home_ownership && (
              <Text className="text-xs text-negative">{errors.home_ownership}</Text>
            )}
          </View>

          <Input
            label="Lama Riwayat Kredit (tahun)"
            placeholder="cth. 3"
            keyboardType="number-pad"
            value={form.cb_person_cred_hist_length}
            onChangeText={set("cb_person_cred_hist_length")}
            error={errors.cb_person_cred_hist_length}
            hint="Berapa tahun kamu sudah memiliki riwayat kredit/pinjaman"
          />
        </View>

        <Button label="Lanjut" loading={loading} onPress={handleNext} className="mt-2xl" />
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
