import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

type DocKey = 'ktp' | 'kk' | 'selfie' | 'bank_letter';

interface DocInfo {
  key: DocKey;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  uploaded?: string;
  uploading?: boolean;
}

export default function KYCScreen() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [docs, setDocs] = useState<DocInfo[]>([
    { key: 'ktp', title: 'KTP', subtitle: 'Foto KTP yang jelas dan tidak buram', icon: 'credit-card' },
    { key: 'kk', title: 'Kartu Keluarga', subtitle: 'Foto KK yang jelas dan lengkap', icon: 'users' },
    { key: 'selfie', title: 'Selfie pegang KTP', subtitle: 'Foto selfie sambil pegang KTP', icon: 'camera' },
    { key: 'bank_letter', title: 'Surat Keterangan Bank', subtitle: 'Surat keterangan rekening dari bank', icon: 'file-text' },
  ]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await userAPI.getKYCStatus();
      const s = res.data;
      setKycStatus(s);
      setDocs((prev) => prev.map((d) => {
        const urlMap: Record<DocKey, string | null> = {
          ktp: s.ktp_image_url,
          kk: s.kk_image_url,
          selfie: s.selfie_image_url,
          bank_letter: s.bank_letter_url,
        };
        return { ...d, uploaded: urlMap[d.key] || undefined };
      }));
    } catch {}
    setPageLoading(false);
  }

  async function pickAndUpload(docKey: DocKey) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const file = result.assets[0];

    setDocs((prev) => prev.map((d) => d.key === docKey ? { ...d, uploading: true } : d));
    try {
      const uploadFns: Record<DocKey, (f: any) => Promise<any>> = {
        ktp: userAPI.uploadKTP,
        kk: userAPI.uploadKK,
        selfie: userAPI.uploadSelfie,
        bank_letter: userAPI.uploadBankLetter,
      };
      const res = await uploadFns[docKey]({ uri: file.uri, fileName: file.fileName, mimeType: file.mimeType });
      setDocs((prev) => prev.map((d) => d.key === docKey ? { ...d, uploaded: res.data.url, uploading: false } : d));
    } catch (e: any) {
      Alert.alert('Upload gagal', e?.response?.data?.detail ?? 'Coba lagi.');
      setDocs((prev) => prev.map((d) => d.key === docKey ? { ...d, uploading: false } : d));
    }
  }

  const allUploaded = docs.every((d) => d.uploaded);
  const isApproved = kycStatus?.review_status === 'approved';
  const isPending = kycStatus?.review_status === 'pending';
  const isRejected = kycStatus?.review_status === 'rejected';

  if (pageLoading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.green} />
        </TouchableOpacity>

        <Text style={styles.title}>Verifikasi identitas</Text>
        <Text style={styles.subtitle}>Upload dokumen berikut untuk melanjutkan</Text>

        {isApproved && (
          <View style={styles.statusCard}>
            <Feather name="check-circle" size={18} color={Colors.green} />
            <Text style={[styles.statusText, { color: Colors.green }]}>KYC kamu sudah disetujui!</Text>
          </View>
        )}
        {isPending && allUploaded && (
          <View style={[styles.statusCard, { borderColor: Colors.orange }]}>
            <Feather name="clock" size={18} color={Colors.orange} />
            <Text style={[styles.statusText, { color: Colors.orange }]}>Sedang direview oleh admin</Text>
          </View>
        )}
        {isRejected && (
          <View style={[styles.statusCard, { borderColor: Colors.red }]}>
            <Feather name="x-circle" size={18} color={Colors.red} />
            <Text style={[styles.statusText, { color: Colors.red }]}>
              Ditolak: {kycStatus?.rejection_reason ?? 'Dokumen tidak valid'}
            </Text>
          </View>
        )}

        {docs.map((doc) => (
          <View key={doc.key} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docIcon}>
                <Feather name={doc.icon} size={20} color={Colors.green} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
              </View>
              {doc.uploaded && !doc.uploading && (
                <Feather name="check-circle" size={20} color={Colors.green} />
              )}
            </View>

            {doc.uploaded && (
              <Image source={{ uri: doc.uploaded }} style={styles.docPreview} />
            )}

            <TouchableOpacity
              style={[styles.uploadBtn, doc.uploaded && styles.uploadBtnDone]}
              onPress={() => pickAndUpload(doc.key)}
              disabled={doc.uploading}
              activeOpacity={0.8}
            >
              {doc.uploading
                ? <ActivityIndicator color={Colors.green} size="small" />
                : <Text style={[styles.uploadBtnText, doc.uploaded && styles.uploadBtnTextDone]}>
                    {doc.uploaded ? 'Ganti foto' : 'Upload'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, !allUploaded && styles.btnDisabled]}
          onPress={() => router.push('/(onboarding)/employment')}
          disabled={!allUploaded}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isApproved ? 'Lanjut' : allUploaded ? 'Kirim untuk direview' : 'Upload semua dokumen dulu'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.greenBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 24 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.green, marginBottom: 20,
  },
  statusText: { fontSize: 14, fontWeight: '600', flex: 1 },
  docCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  docIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.greenGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: { color: Colors.white, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  docSubtitle: { color: Colors.gray, fontSize: 12 },
  docPreview: { width: '100%', height: 140, borderRadius: 10, marginBottom: 10, backgroundColor: Colors.surface2 },
  uploadBtn: {
    borderWidth: 1.5, borderColor: Colors.green, borderRadius: 999,
    paddingVertical: 8, paddingHorizontal: 20, alignSelf: 'flex-start',
  },
  uploadBtnDone: { borderColor: Colors.border },
  uploadBtnText: { color: Colors.green, fontSize: 14, fontWeight: '600' },
  uploadBtnTextDone: { color: Colors.gray },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
