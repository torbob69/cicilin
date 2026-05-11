import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, Fonts, Radius } from '../constants/theme';
import { api } from '../services/api';

function UploadBox({
  label,
  hint,
  imageUri,
  onPick,
}: {
  label: string;
  hint: string;
  imageUri: string | null;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity style={styles.uploadBox} onPress={onPick} activeOpacity={0.75}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
      ) : (
        <View style={styles.uploadPlaceholder}>
          <View style={styles.uploadIcon}>
            <Feather name="upload" size={24} color={Colors.mint} />
          </View>
          <Text style={styles.uploadLabel}>{label}</Text>
          <Text style={styles.uploadHint}>{hint}</Text>
        </View>
      )}
      {imageUri && (
        <View style={styles.changeOverlay}>
          <Feather name="camera" size={16} color="#fff" />
          <Text style={styles.changeText}>Change</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function KycUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ktpUri, setKtpUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (
    setter: (uri: string) => void,
    source: 'camera' | 'gallery',
  ) => {
    const { status } =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access in your device settings.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const showSourcePicker = (setter: (uri: string) => void) => {
    Alert.alert('Select Image', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage(setter, 'camera') },
      { text: 'Gallery', onPress: () => pickImage(setter, 'gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadFile = async (endpoint: string, uri: string, fieldName: string) => {
    const form = new FormData();
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    form.append(fieldName, { uri, name: filename, type: mimeType } as any);
    await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const submit = async () => {
    if (!ktpUri || !selfieUri) {
      Alert.alert('Missing Photos', 'Please upload both your KTP and selfie.');
      return;
    }
    setUploading(true);
    try {
      await uploadFile('/users/kyc/upload-ktp', ktpUri, 'file');
      await uploadFile('/users/kyc/upload-selfie', selfieUri, 'file');
      Alert.alert(
        'Documents Submitted',
        'Your KTP and selfie have been uploaded. Our team will review them shortly.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Upload Failed', e.response?.data?.detail ?? 'Could not upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.ink700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload KTP</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Upload a clear photo of your KTP and a selfie holding it. Both are required for identity verification.
        </Text>

        <Text style={styles.sectionLabel}>KTP Photo</Text>
        <GlassCard padding={0} style={{ marginBottom: 20 }}>
          <UploadBox
            label="Tap to upload KTP"
            hint="Clear, flat, all corners visible"
            imageUri={ktpUri}
            onPick={() => showSourcePicker(setKtpUri)}
          />
        </GlassCard>

        <Text style={styles.sectionLabel}>Selfie Holding KTP</Text>
        <GlassCard padding={0} style={{ marginBottom: 20 }}>
          <UploadBox
            label="Tap to take selfie"
            hint="Hold your KTP next to your face"
            imageUri={selfieUri}
            onPick={() => showSourcePicker(setSelfieUri)}
          />
        </GlassCard>

        <GlassCard padding={16} style={{ marginBottom: 8 }}>
          <View style={styles.tipRow}>
            <Feather name="info" size={14} color={Colors.amber} />
            <Text style={styles.tipText}>
              Make sure all text on the KTP is readable and there is no glare or blur.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label="Submit Documents"
          onPress={submit}
          variant="primary"
          size="lg"
          fullWidth
          loading={uploading}
          disabled={!ktpUri || !selfieUri}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: Fonts.display, fontSize: 18, color: Colors.ink900, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  intro: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500, lineHeight: 22, marginBottom: 24 },
  sectionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  uploadBox: { borderRadius: Radius.xl, overflow: 'hidden', minHeight: 180 },
  uploadPlaceholder: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  uploadIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.mintDim, alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.ink900 },
  uploadHint: { fontFamily: Fonts.body, fontSize: 13, color: Colors.ink500, textAlign: 'center' },
  previewImage: { width: '100%', height: 220 },
  changeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  changeText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: '#fff' },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.ink500, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
});
