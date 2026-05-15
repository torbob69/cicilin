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

export default function EmploymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({
    occupation: "",
    employer_name: "",
    job_title: "",
    emp_length: "",
    annual_income: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.occupation.trim()) e.occupation = "Pekerjaan wajib diisi";
    if (!form.employer_name.trim()) e.employer_name = "Nama perusahaan wajib diisi";
    if (!form.job_title.trim()) e.job_title = "Jabatan wajib diisi";
    if (isNaN(Number(form.emp_length)) || Number(form.emp_length) < 0)
      e.emp_length = "Masukkan tahun yang valid";
    if (isNaN(Number(form.annual_income)) || Number(form.annual_income) <= 0)
      e.annual_income = "Masukkan penghasilan tahunan yang valid (IDR)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.updateEmployment({
        occupation: form.occupation.trim(),
        employer_name: form.employer_name.trim(),
        job_title: form.job_title.trim(),
        emp_length: Number(form.emp_length),
        annual_income: Number(form.annual_income),
      });
      router.push("/(onboarding)/bank-account");
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
              className={`h-1 flex-1 rounded-pill ${s <= 2 ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Pekerjaan</Text>
        <Text className="text-sm text-body mb-2xl">Langkah 2 dari 5 — Verifikasi penghasilan</Text>

        <View className="gap-lg">
          <Input
            label="Pekerjaan"
            placeholder="cth. Software Engineer"
            value={form.occupation}
            onChangeText={set("occupation")}
            error={errors.occupation}
          />
          <Input
            label="Nama Perusahaan"
            placeholder="PT. Contoh Indonesia"
            value={form.employer_name}
            onChangeText={set("employer_name")}
            error={errors.employer_name}
          />
          <Input
            label="Jabatan"
            placeholder="cth. Senior Developer"
            value={form.job_title}
            onChangeText={set("job_title")}
            error={errors.job_title}
          />
          <Input
            label="Lama Bekerja (tahun)"
            placeholder="cth. 3"
            keyboardType="decimal-pad"
            value={form.emp_length}
            onChangeText={set("emp_length")}
            error={errors.emp_length}
          />
          <Input
            label="Penghasilan Tahunan (IDR)"
            placeholder="cth. 72000000"
            keyboardType="number-pad"
            value={form.annual_income}
            onChangeText={set("annual_income")}
            error={errors.annual_income}
            hint="Penghasilan kotor sebelum pajak"
          />
        </View>

        <Button label="Lanjut" loading={loading} onPress={handleNext} className="mt-2xl" />
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
