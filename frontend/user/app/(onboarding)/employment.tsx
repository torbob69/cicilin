import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userAPI } from '../../services/api';
import { Colors } from '../../constants/colors';

const HOME_OPTIONS = [
  { label: 'Sewa', value: 'RENT' },
  { label: 'Milik Sendiri', value: 'OWN' },
  { label: 'KPR', value: 'MORTGAGE' },
  { label: 'Lainnya', value: 'OTHER' },
];

export default function EmploymentScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    occupation: '',
    employer_name: '',
    job_title: '',
    emp_length: '',
    annual_income: '',
    home_ownership: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    if (!form.occupation || !form.annual_income || !form.emp_length) {
      setError('Pekerjaan, penghasilan, dan lama bekerja wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userAPI.upsertEmployment({
        occupation: form.occupation,
        employer_name: form.employer_name || undefined,
        job_title: form.job_title || undefined,
        emp_length: parseFloat(form.emp_length),
        annual_income: parseFloat(form.annual_income.replace(/\D/g, '')),
      });
      if (form.home_ownership) {
        await userAPI.updateMe({ home_ownership: form.home_ownership });
      }
      router.push('/(onboarding)/bank-account');
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={Colors.green} />
          </TouchableOpacity>

          <Text style={styles.title}>Info pekerjaan kamu</Text>
          <Text style={styles.subtitle}>Diperlukan untuk penilaian pinjaman</Text>

          {[
            { label: 'Pekerjaan *', field: 'occupation' as const, placeholder: 'cth: Karyawan Swasta' },
            { label: 'Nama Perusahaan', field: 'employer_name' as const, placeholder: 'cth: PT. Contoh Indonesia' },
            { label: 'Jabatan', field: 'job_title' as const, placeholder: 'cth: Software Engineer' },
            { label: 'Lama Bekerja (tahun) *', field: 'emp_length' as const, placeholder: 'cth: 3', numeric: true },
            { label: 'Penghasilan per Tahun (IDR) *', field: 'annual_income' as const, placeholder: 'cth: 60000000', numeric: true },
          ].map(({ label, field, placeholder, numeric }) => (
            <View key={field}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.gray}
                  value={form[field]}
                  onChangeText={(v) => update(field, v)}
                  keyboardType={numeric ? 'numeric' : 'default'}
                />
              </View>
            </View>
          ))}

          <Text style={styles.label}>Status Tempat Tinggal</Text>
          <View style={styles.optionsRow}>
            {HOME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optPill, form.home_ownership === opt.value && styles.optPillSelected]}
                onPress={() => update('home_ownership', opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optPillText, form.home_ownership === opt.value && styles.optPillTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Lanjut</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
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
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  optPill: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surface,
  },
  optPillSelected: { borderColor: Colors.green, backgroundColor: Colors.greenGlow },
  optPillText: { color: Colors.gray, fontSize: 14, fontWeight: '600' },
  optPillTextSelected: { color: Colors.green },
  errorText: { color: Colors.red, fontSize: 13, marginTop: 12 },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
