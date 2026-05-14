import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function BankAccountScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    is_primary: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof typeof form, val: any) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    if (!form.bank_name || !form.account_number || !form.account_holder_name) {
      setError('Semua field wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userAPI.addBankAccount(form);
      router.replace('/(tabs)/');
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.green} />
        </TouchableOpacity>

        <Text style={styles.title}>Tambah rekening</Text>
        <Text style={styles.subtitle}>Rekening untuk pencairan pinjaman</Text>

        {[
          { label: 'Nama Bank', field: 'bank_name' as const, placeholder: 'cth: BCA, Mandiri, BNI' },
          { label: 'Nomor Rekening', field: 'account_number' as const, placeholder: 'Nomor rekening', numeric: true },
          { label: 'Nama Pemilik Rekening', field: 'account_holder_name' as const, placeholder: 'Sesuai buku tabungan' },
        ].map(({ label, field, placeholder, numeric }) => (
          <View key={field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.gray}
                value={form[field] as string}
                onChangeText={(v) => update(field, v)}
                keyboardType={numeric ? 'numeric' : 'default'}
              />
            </View>
          </View>
        ))}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Jadikan rekening utama</Text>
          <Switch
            value={form.is_primary}
            onValueChange={(v) => update('is_primary', v)}
            trackColor={{ false: Colors.border, true: Colors.green }}
            thumbColor={Colors.white}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Simpan & Lanjut</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)/')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Lewati, nanti aja</Text>
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
  subtitle: { color: Colors.gray, fontSize: 15, marginBottom: 28 },
  label: { color: Colors.grayLight, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, height: 52, justifyContent: 'center',
  },
  input: { color: Colors.white, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 4 },
  switchLabel: { color: Colors.white, fontSize: 15, fontWeight: '500' },
  errorText: { color: Colors.red, fontSize: 13, marginTop: 12 },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 16 },
  skipText: { color: Colors.gray, fontSize: 14 },
});
