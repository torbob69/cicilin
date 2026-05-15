import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { userService } from "@/services/users";
import { Button } from "@/components/ui/Button";
import { useToast, Toast } from "@/components/ui/Toast";
import { parseApiError } from "@/utils/api";

type DocKey = "ktp" | "kk" | "selfie" | "bank_letter";

const DOC_CONFIG: Record<DocKey, { label: string; hint: string; upload: (uri: string) => Promise<any> }> = {
  ktp: { label: "KTP", hint: "Foto KTP yang jelas", upload: userService.uploadKtp },
  kk: { label: "Kartu Keluarga", hint: "Foto Kartu Keluarga yang jelas", upload: userService.uploadKk },
  selfie: { label: "Selfie Liveness", hint: "Selfie sambil memegang KTP di samping wajah", upload: userService.uploadSelfie },
  bank_letter: { label: "Surat Keterangan Bank", hint: "Surat dari bank yang mengonfirmasi rekening", upload: userService.uploadBankLetter },
};

export default function DocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show, hide } = useToast();

  const [uris, setUris] = useState<Partial<Record<DocKey, string>>>({});
  const [uploaded, setUploaded] = useState<Partial<Record<DocKey, boolean>>>({});
  const [loading, setLoading] = useState<Partial<Record<DocKey, boolean>>>({});

  const pickAndUpload = async (key: DocKey) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      show("Izin akses galeri diperlukan", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUris((p) => ({ ...p, [key]: asset.uri }));
    setLoading((p) => ({ ...p, [key]: true }));

    try {
      await DOC_CONFIG[key].upload(asset.uri);
      setUploaded((p) => ({ ...p, [key]: true }));
      show(`${DOC_CONFIG[key].label} uploaded`, "success");
    } catch (err: any) {
      show(parseApiError(err, "Gagal mengunggah"), "error");
      setUris((p) => ({ ...p, [key]: undefined }));
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const allDone = (["ktp", "kk", "selfie", "bank_letter"] as DocKey[]).every(
    (k) => uploaded[k]
  );

  return (
    <View className="flex-1 bg-canvas-soft">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48 }}
        className="px-xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-xl">
          <Ionicons name="chevron-back" size={24} color="#e8ebe6" />
        </TouchableOpacity>

        <View className="flex-row gap-xs mb-2xl">
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              className={`h-1 flex-1 rounded-pill ${s <= 4 ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </View>

        <Text className="text-2xl font-sans-black text-ink mb-xs">Dokumen</Text>
        <Text className="text-sm text-body mb-2xl">Langkah 4 dari 5 — Verifikasi KYC</Text>

        <View className="gap-lg">
          {(Object.keys(DOC_CONFIG) as DocKey[]).map((key) => {
            const cfg = DOC_CONFIG[key];
            const uri = uris[key];
            const done = uploaded[key];
            const busy = loading[key];

            return (
              <TouchableOpacity
                key={key}
                onPress={() => !done && pickAndUpload(key)}
                disabled={busy}
                activeOpacity={0.8}
              >
                <View
                  className={`rounded-xl overflow-hidden border ${done ? "border-positive" : "border-ink/20"
                    } bg-canvas`}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: 140 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-28 items-center justify-center bg-canvas-soft gap-xs">
                      <Ionicons name="document-outline" size={28} color="#525550" />
                      <Text className="text-sm text-mute">Ketuk untuk unggah</Text>
                    </View>
                  )}
                  <View className="p-lg flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-sans-semibold text-ink">{cfg.label}</Text>
                      <Text className="text-xs text-mute mt-xxs">{cfg.hint}</Text>
                    </View>
                    {done && (
                      <View className="bg-primary-pale rounded-pill px-md py-xs flex-row items-center gap-xs">
                        <Ionicons name="checkmark" size={11} color="#86efac" />
                        <Text className="text-xs font-sans-semibold text-positive-deep">Selesai</Text>
                      </View>
                    )}
                    {busy && (
                      <Text className="text-xs text-mute">Mengunggah…</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {!allDone && (
          <View className="bg-warning/20 rounded-xl p-lg mt-xl">
            <Text className="text-sm text-warning-content">
              Semua 4 dokumen wajib diunggah sebelum admin dapat meninjau KYC kamu.
            </Text>
          </View>
        )}

        <Button
          label="Continue"
          onPress={() => router.push("/(onboarding)/set-pin")}
          disabled={!allDone}
          className="mt-2xl"
        />
      </ScrollView>

      <Toast {...toast} onHide={hide} />
    </View>
  );
}
