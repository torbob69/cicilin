import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, Fonts, Radius } from '../constants/theme';
import { api } from '../services/api';

const HOME_OPTIONS = [
  { value: 'RENT', label: 'Renting' },
  { value: 'OWN', label: 'Own Home' },
  { value: 'MORTGAGE', label: 'Mortgage' },
  { value: 'OTHER', label: 'Other' },
];

const EMP_YEARS = [
  { value: 0.5, label: '< 1 yr' },
  { value: 1, label: '1 yr' },
  { value: 2, label: '2 yr' },
  { value: 3, label: '3 yr' },
  { value: 5, label: '5 yr' },
  { value: 7, label: '7 yr' },
  { value: 10, label: '10+ yr' },
];

const MAX_DOB = new Date(new Date().getFullYear() - 21, 11, 31);
const DEFAULT_DOB = new Date(1995, 0, 1);

function formatDobDisplay(d: Date) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function DatePickerField({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value ?? DEFAULT_DOB);

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const confirmIOS = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.dateField} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Feather name="calendar" size={16} color={Colors.ink400} />
        <Text style={[styles.dateText, !value && { color: Colors.ink400 }]}>
          {value ? formatDobDisplay(value) : 'Select date of birth'}
        </Text>
        <Feather name="chevron-right" size={16} color={Colors.ink400} />
      </TouchableOpacity>

      {/* Android: native dialog */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={value ?? DEFAULT_DOB}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={MAX_DOB}
        />
      )}

      {/* iOS: modal with spinner */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShow(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={confirmIOS}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={MAX_DOB}
              themeVariant="dark"
            />
          </View>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { value: any; label: string }[];
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={String(opt.value)}
          style={[styles.chip, value === opt.value && styles.chipActive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipLabel, value === opt.value && { color: Colors.mint }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [homeOwnership, setHomeOwnership] = useState('');
  const [address, setAddress] = useState('');

  // Employment
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [empLength, setEmpLength] = useState<number>(0);
  const [incomeStr, setIncomeStr] = useState('');

  const rawIncome = parseInt(incomeStr.replace(/[^0-9]/g, '') || '0', 10);

  useEffect(() => {
    api.get('/users/me').then(res => {
      const u = res.data;
      setFullName(u.full_name ?? '');
      setHomeOwnership(u.home_ownership ?? '');
      setAddress(u.address ?? '');
      if (u.date_of_birth) setDob(new Date(u.date_of_birth));
      if (u.employment) {
        setEmployerName(u.employment.employer_name ?? '');
        setJobTitle(u.employment.job_title ?? '');
        setEmpLength(u.employment.emp_length ?? 0);
        if (u.employment.annual_income) {
          setIncomeStr(new Intl.NumberFormat('id-ID').format(u.employment.annual_income));
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleIncomeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setIncomeStr(digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits, 10)) : '');
  };

  const save = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = { full_name: fullName };
      if (homeOwnership) updates.home_ownership = homeOwnership;
      if (address) updates.address = address;
      if (dob) {
        const yyyy = dob.getFullYear();
        const mm = String(dob.getMonth() + 1).padStart(2, '0');
        const dd = String(dob.getDate()).padStart(2, '0');
        updates.date_of_birth = `${yyyy}-${mm}-${dd}`;
      }

      await api.put('/users/me', updates);

      if (employerName || empLength || rawIncome) {
        await api.post('/users/employment', {
          employer_name: employerName || undefined,
          job_title: jobTitle || undefined,
          emp_length: empLength || undefined,
          annual_income: rawIncome || undefined,
        });
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.mint} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.ink700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Personal Info</Text>
        <GlassCard padding={16} style={{ marginBottom: 20 }}>
          <Field label="Full Name">
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nicholas Wilson"
              placeholderTextColor={Colors.ink400}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Date of Birth">
            <DatePickerField value={dob} onChange={setDob} />
          </Field>

          <Field label="Home Ownership">
            <ChipRow options={HOME_OPTIONS} value={homeOwnership} onChange={setHomeOwnership} />
          </Field>

          <Field label="Address (optional)">
            <TextInput
              style={[styles.input, { minHeight: 52 }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Jl. Sudirman No. 1, Jakarta"
              placeholderTextColor={Colors.ink400}
              autoCapitalize="sentences"
              multiline
            />
          </Field>
        </GlassCard>

        <Text style={styles.sectionLabel}>Employment</Text>
        <GlassCard padding={16}>
          <Field label="Employer / Company Name">
            <TextInput
              style={styles.input}
              value={employerName}
              onChangeText={setEmployerName}
              placeholder="PT Maju Bersama"
              placeholderTextColor={Colors.ink400}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Job Title (optional)">
            <TextInput
              style={styles.input}
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="Software Engineer"
              placeholderTextColor={Colors.ink400}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Years Employed">
            <ChipRow options={EMP_YEARS} value={empLength} onChange={setEmpLength} />
          </Field>

          <Field label="Annual Income (IDR)">
            <View style={styles.incomeRow}>
              <Text style={styles.currencyLabel}>Rp</Text>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                value={incomeStr}
                onChangeText={handleIncomeChange}
                placeholder="60.000.000"
                placeholderTextColor={Colors.ink400}
                keyboardType="number-pad"
                maxLength={15}
              />
            </View>
          </Field>
        </GlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Button label="Save Changes" onPress={save} variant="primary" size="lg" fullWidth loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: Fonts.display, fontSize: 18, color: Colors.ink900, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.ink500, marginBottom: 8 },
  input: {
    backgroundColor: Colors.ink100,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.ink900,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.ink100,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.ink900 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { borderColor: Colors.mint, backgroundColor: Colors.mintDim },
  chipLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500 },
  incomeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink100, borderRadius: Radius.md, paddingLeft: 14 },
  currencyLabel: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.ink500, marginRight: 6 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.ink900 },
  modalCancel: { fontFamily: Fonts.body, fontSize: 16, color: Colors.ink500 },
  modalDone: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.mint },
});
