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
import { parseApiError } from "@/utils/api";

export default function BankAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.bank_name.trim()) e.bank_name = "Nama bank wajib diisi";
    if (!form.account_number.trim()) e.account_number = "Nomor rekening wajib diisi";
    if (!form.account_holder_name.trim()) e.account_holder_name = "Nama pemilik rekening wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.addBankAccount(form);
      router.push("/(onboarding)/documents");
    } catch (err: any) {
      show(parseApiError(err, "Gagal menyimpan"), "error");
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

        <View className="flex-row gap-xs mb-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              className={`h-1 flex-1 rounded-pill ${s <= 3 ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Rekening Bank</Text>
        <Text className="text-sm text-body mb-2xl">Langkah 3 dari 5 — Untuk pencairan dana</Text>

        <View className="gap-lg">
          <Input
            label="Nama Bank"
            placeholder="cth. BCA, Mandiri, BRI"
            value={form.bank_name}
            onChangeText={set("bank_name")}
            error={errors.bank_name}
          />
          <Input
            label="Nomor Rekening"
            placeholder="Nomor rekening bank kamu"
            keyboardType="number-pad"
            value={form.account_number}
            onChangeText={set("account_number")}
            error={errors.account_number}
          />
          <Input
            label="Nama Pemilik Rekening"
            placeholder="Sesuai yang terdaftar di bank"
            value={form.account_holder_name}
            onChangeText={set("account_holder_name")}
            error={errors.account_holder_name}
          />
        </View>

        <View className="bg-primary-pale rounded-xl p-lg mt-xl">
          <Text className="text-sm text-positive-deep">
            Rekening bank kamu akan digunakan untuk menerima dana pinjaman yang disetujui.
            Pastikan nama sesuai dengan KTP.
          </Text>
        </View>

        <Button label="Lanjut" loading={loading} onPress={handleNext} className="mt-2xl" />
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
