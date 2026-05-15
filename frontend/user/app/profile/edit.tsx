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
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { HOME_OWNERSHIP_OPTIONS } from "@/constants/config";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, fetchProfile } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [form, setForm] = useState({
    address: user?.address ?? "",
    home_ownership: user?.home_ownership ?? "",
    cb_person_cred_hist_length: String(user?.cb_person_cred_hist_length ?? ""),
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await userService.updateMe({
        address: form.address,
        home_ownership: form.home_ownership,
        cb_person_cred_hist_length: Number(form.cb_person_cred_hist_length),
      });
      await fetchProfile();
      show("Profile updated", "success");
      setTimeout(() => router.back(), 600);
    } catch (err: any) {
      show(err?.response?.data?.detail ?? "Update failed", "error");
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

        <Text className="text-2xl font-sans-black text-ink mb-2xl">Edit Profile</Text>

        <View className="gap-lg">
          <Input
            label="Address"
            placeholder="Your current address"
            multiline
            numberOfLines={3}
            value={form.address}
            onChangeText={set("address")}
          />

          <View className="gap-xs">
            <Text className="text-sm font-sans-semibold text-ink">Home Ownership</Text>
            <View className="flex-row flex-wrap gap-sm">
              {HOME_OWNERSHIP_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => set("home_ownership")(opt.value)}
                  className={`px-lg py-sm rounded-xl border ${
                    form.home_ownership === opt.value
                      ? "bg-canvas border-primary"
                      : "bg-canvas-soft border-white/[0.06]"
                  }`}
                >
                  <Text className={`text-sm font-sans-semibold ${form.home_ownership === opt.value ? "text-primary" : "text-mute"}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Credit History Length (years)"
            placeholder="e.g. 3"
            keyboardType="number-pad"
            value={form.cb_person_cred_hist_length}
            onChangeText={set("cb_person_cred_hist_length")}
          />
        </View>

        <View className="bg-canvas-soft rounded-xl p-lg mt-xl border border-ink/10">
          <Text className="text-xs text-mute">
            Fields locked after KYC approval: Full Name, NIK, Date of Birth.
            Contact support to update employment details.
          </Text>
        </View>

        <Button label="Save Changes" loading={loading} onPress={handleSave} className="mt-2xl" />
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </KeyboardAvoidingView>
  );
}
