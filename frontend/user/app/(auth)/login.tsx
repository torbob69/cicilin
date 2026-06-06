import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { parseApiError } from "@/utils/api";


// ── Forgot Password Modal ─────────────────────────────────────────────────────

type FpStep = "phone" | "otp" | "password";

function ForgotPasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { toast, show, hide } = useToast();
  const [step, setStep] = useState<FpStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      show("Masukkan nomor HP kamu", "error");
      return;
    }
    try {
      setLoading(true);
      await authService.forgotPassword({ phone: phone.trim() });
      setStep("otp");
    } catch (err: any) {
      show(parseApiError(err, "Gagal mengirim OTP"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      show("Kode OTP harus 6 angka", "error");
      return;
    }
    setStep("password");
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      await authService.forgotPassword({ phone: phone.trim() });
      show("OTP baru telah dikirim ke WhatsApp kamu", "success");
    } catch (err: any) {
      show(parseApiError(err, "Gagal mengirim ulang OTP"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      show("Password minimal 8 karakter", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      show("Konfirmasi password tidak cocok", "error");
      return;
    }
    try {
      setLoading(true);
      await authService.resetPassword({
        phone: phone.trim(),
        otp_code: otp,
        new_password: newPassword,
      });
      show("Password berhasil direset! Silakan login.", "success");
      setTimeout(handleClose, 1500);
    } catch (err: any) {
      const msg = parseApiError(err, "Gagal reset password");
      show(msg, "error");
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("expired")) {
        setOtp("");
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === "phone" ? "Lupa Password" : step === "otp" ? "Kode OTP" : "Password Baru";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView behavior="padding">
          <View className="bg-canvas rounded-t-3xl px-xl pt-xl pb-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-xl">
              <Text className="text-xl font-sans-black text-ink">{stepTitle}</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text className="text-sm text-mute">Batal</Text>
              </TouchableOpacity>
            </View>

            {/* Step 1 — Phone */}
            {step === "phone" && (
              <View className="gap-lg">
                <Text className="text-sm text-body">
                  Masukkan nomor HP yang terdaftar. Kami akan mengirimkan OTP via WhatsApp.
                </Text>
                <Input
                  label="Nomor HP"
                  placeholder="08xx xxxx xxxx"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoCapitalize="none"
                />
                <Button label="Kirim OTP" loading={loading} onPress={handleSendOtp} />
              </View>
            )}

            {/* Step 2 — OTP */}
            {step === "otp" && (
              <View className="gap-lg">
                <Text className="text-sm text-body">
                  Masukkan 6 digit kode yang dikirim ke{" "}
                  <Text className="font-sans-semibold text-ink">{phone}</Text> via WhatsApp.
                </Text>
                <Input
                  label="Kode OTP"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
                <Button label="Lanjut" onPress={handleVerifyOtp} />
                <View className="flex-row justify-center gap-xs">
                  <Text className="text-sm text-body">Tidak menerima kode?</Text>
                  <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                    <Text className="text-sm font-sans-semibold text-primary underline">
                      Kirim ulang
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setStep("phone")} className="items-center">
                  <Text className="text-xs text-mute">← Ganti nomor HP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3 — New Password */}
            {step === "password" && (
              <View className="gap-lg">
                <Text className="text-sm text-body">
                  Buat password baru untuk akunmu. Minimal 8 karakter.
                </Text>
                <Input
                  label="Password Baru"
                  placeholder="Password baru"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Input
                  label="Konfirmasi Password"
                  placeholder="Ulangi password baru"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Button label="Reset Password" loading={loading} onPress={handleResetPassword} />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        <Toast {...toast} onHide={hide} />
      </View>
    </Modal>
  );
}


// ── Login Screen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!phone.trim()) e.phone = "Nomor HP wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login({ phone: phone.trim(), password });
      await login(res.data.access_token, res.data.refresh_token);
      router.replace("/(tabs)");
    } catch (err: any) {
      show(parseApiError(err, "Login gagal. Periksa nomor HP dan password kamu."), "error");
      setLoginFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#1a1c18" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero band */}
        <View
          style={{ paddingTop: insets.top + 48, paddingBottom: 40 }}
          className="px-2xl"
        >
          <View className="flex flex-col gap-16">
            <View className="mb-xs">
              <Text className="text-4xl font-sans-black text-white leading-none tracking-tight" style={{ fontFamily: "PixelifySans_400Regular" }}>
                cicil.<Text className="text-primary">in</Text>
              </Text>
            </View>
            <View className="flex flex-col">
              <Text className="text-5xl text-white tracking-tight font-semibold leading-tight">
                Pinjaman <Text className="text-primary">cepat</Text>, dengan cicilan <Text className="text-primary">ringan</Text>.
              </Text>
              <Text className="text-ink/70 text-xs mt-md">Dapatkan keputusan pinjaman dalam hitungan detik dengan AI scoring.</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Form card */}
        <View className="bg-canvas rounded-t-3xl px-xl pt-2xl pb-xl">
          <Text className="text-2xl font-sans-black text-ink mb-xl pr-1">Masuk</Text>

          <View className="gap-lg flex flex-col">
            <Input
              label="Nomor HP"
              placeholder="08xx xxxx xxxx"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />

            {/* Password field with Forgot Password link */}
            <View className="gap-xs">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-sans-semibold text-ink">Password</Text>
                <TouchableOpacity
                  onPress={() => setShowForgot(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-xs text-primary">Lupa password?</Text>
                </TouchableOpacity>
              </View>
              <Input
                placeholder="Password kamu"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (loginFailed) setLoginFailed(false);
                }}
                error={errors.password}
              />
            </View>
          </View>

          <Button
            label="Masuk"
            loading={loading}
            onPress={handleLogin}
            className="mt-2xl"
          />

          {/* Shown after a failed login attempt */}
          {loginFailed && (
            <TouchableOpacity
              onPress={() => setShowForgot(true)}
              className="items-center mt-lg"
            >
              <Text className="text-sm font-sans-semibold text-primary">
                Password salah? Reset di sini →
              </Text>
            </TouchableOpacity>
          )}

          <View className="flex-row justify-center mt-xl gap-xs">
            <Text className="text-sm text-body">Belum punya akun?</Text>
            <TouchableOpacity style={{ flexShrink: 0 }} onPress={() => router.push("/(auth)/register")}>
              <Text className="text-sm font-sans-semibold text-ink underline pr-1">
                Daftar sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Toast {...toast} onHide={hide} />
      <ForgotPasswordModal visible={showForgot} onClose={() => setShowForgot(false)} />
    </KeyboardAvoidingView>
  );
}
