import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Fonts, Radius, Shadow } from '../../constants/theme';
import { api } from '../../services/api';

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
      <TouchableOpacity style={dpStyles.field} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Feather name="calendar" size={16} color={Colors.ink400} />
        <Text style={[dpStyles.text, !value && { color: Colors.ink400 }]}>
          {value ? formatDobDisplay(value) : 'Select date of birth'}
        </Text>
        <Feather name="chevron-right" size={16} color={Colors.ink400} />
      </TouchableOpacity>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={value ?? DEFAULT_DOB}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={MAX_DOB}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={dpStyles.overlay} onPress={() => setShow(false)} />
          <View style={dpStyles.sheet}>
            <View style={dpStyles.sheetHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={dpStyles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={dpStyles.title}>Date of Birth</Text>
              <TouchableOpacity onPress={confirmIOS}>
                <Text style={dpStyles.done}>Done</Text>
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

const dpStyles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  text: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.ink900 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.ink900 },
  cancel: { fontFamily: Fonts.body, fontSize: 16, color: Colors.ink500 },
  done: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.mint },
});

const HOME_OPTIONS = [
  { value: 'RENT', label: 'Renting', icon: 'key' as const },
  { value: 'OWN', label: 'Own Home', icon: 'home' as const },
  { value: 'MORTGAGE', label: 'Mortgage', icon: 'credit-card' as const },
  { value: 'OTHER', label: 'Other', icon: 'more-horizontal' as const },
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

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dot.base,
            i === step - 1 && dot.active,
            i < step - 1 && dot.done,
          ]}
        />
      ))}
    </View>
  );
}

const dot = StyleSheet.create({
  base: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ink100 },
  active: { width: 20, backgroundColor: Colors.mint },
  done: { backgroundColor: Colors.mintText },
});

function OptionChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Feather name={icon} size={16} color={active ? Colors.mint : Colors.ink500} />}
      <Text style={[styles.chipLabel, active && { color: Colors.mint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — personal
  const [homeOwnership, setHomeOwnership] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState<Date | null>(null);

  // Step 2 — employment
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [empLength, setEmpLength] = useState(0);
  const [incomeStr, setIncomeStr] = useState('');

  const rawIncome = parseInt(incomeStr.replace(/[^0-9]/g, '') || '0', 10);

  const canNext1 = !!homeOwnership && !!dob;
  const canNext2 = !!employerName && empLength > 0 && rawIncome >= 1_000_000;

  const handleIncomeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setIncomeStr(digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits, 10)) : '');
  };

  const submit = async () => {
    setLoading(true);
    try {
      const yyyy = dob!.getFullYear();
      const mm = String(dob!.getMonth() + 1).padStart(2, '0');
      const dd = String(dob!.getDate()).padStart(2, '0');
      const dobIso = `${yyyy}-${mm}-${dd}`;

      await Promise.all([
        api.put('/users/me', {
          home_ownership: homeOwnership,
          date_of_birth: dobIso,
          ...(address ? { address } : {}),
        }),
        api.post('/users/employment', {
          employer_name: employerName,
          job_title: jobTitle || undefined,
          emp_length: empLength,
          annual_income: rawIncome,
        }),
      ]);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.ink700} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <StepDots step={step} total={2} />
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Home ownership */}
        {step === 1 && (
          <>
            <Text style={styles.heading}>Where do{'\n'}you live?</Text>
            <Text style={styles.sub}>This helps us calculate your loan eligibility</Text>

            <View style={styles.optionGrid}>
              {HOME_OPTIONS.map(opt => (
                <OptionChip
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  active={homeOwnership === opt.value}
                  onPress={() => setHomeOwnership(opt.value)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <GlassCard padding={0} style={{ marginBottom: 4 }}>
              <DatePickerField value={dob} onChange={setDob} />
            </GlassCard>

            <Text style={styles.fieldLabel}>Address <Text style={styles.optional}>(optional)</Text></Text>
            <GlassCard padding={0} style={{ marginBottom: 4 }}>
              <TextInput
                style={styles.textInput}
                placeholder="Jl. Sudirman No. 1, Jakarta"
                placeholderTextColor={Colors.ink400}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                multiline
                numberOfLines={2}
              />
            </GlassCard>
          </>
        )}

        {/* STEP 2: Employment */}
        {step === 2 && (
          <>
            <Text style={styles.heading}>Tell us about{'\n'}your work</Text>
            <Text style={styles.sub}>Required for the loan scoring process</Text>

            <Text style={styles.fieldLabel}>Employer / Company Name</Text>
            <GlassCard padding={0} style={{ marginBottom: 16 }}>
              <TextInput
                style={styles.textInput}
                placeholder="PT Maju Bersama"
                placeholderTextColor={Colors.ink400}
                value={employerName}
                onChangeText={setEmployerName}
                autoCapitalize="words"
              />
            </GlassCard>

            <Text style={styles.fieldLabel}>Job Title <Text style={styles.optional}>(optional)</Text></Text>
            <GlassCard padding={0} style={{ marginBottom: 16 }}>
              <TextInput
                style={styles.textInput}
                placeholder="Software Engineer"
                placeholderTextColor={Colors.ink400}
                value={jobTitle}
                onChangeText={setJobTitle}
                autoCapitalize="words"
              />
            </GlassCard>

            <Text style={styles.fieldLabel}>Years Employed</Text>
            <View style={styles.chipRow}>
              {EMP_YEARS.map(y => (
                <OptionChip
                  key={y.value}
                  label={y.label}
                  active={empLength === y.value}
                  onPress={() => setEmpLength(y.value)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Annual Income (IDR)</Text>
            <GlassCard padding={0}>
              <View style={styles.incomeRow}>
                <Text style={styles.currencyLabel}>Rp</Text>
                <TextInput
                  style={styles.incomeInput}
                  placeholder="60.000.000"
                  placeholderTextColor={Colors.ink400}
                  value={incomeStr}
                  onChangeText={handleIncomeChange}
                  keyboardType="number-pad"
                  maxLength={15}
                />
              </View>
            </GlassCard>
            {rawIncome > 0 && rawIncome < 1_000_000 && (
              <Text style={styles.incomeHint}>Minimum Rp 1.000.000 per year</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {step === 1 ? (
          <Button
            label="Next"
            onPress={() => setStep(2)}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canNext1}
          />
        ) : (
          <Button
            label="Complete Setup"
            onPress={submit}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!canNext2}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink400 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  heading: { fontFamily: Fonts.display, fontSize: 30, color: Colors.ink900, lineHeight: 38, marginBottom: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500, marginBottom: 28 },
  fieldLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500, marginBottom: 10, marginTop: 20 },
  optional: { fontFamily: Fonts.body, color: Colors.ink400 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.mint, backgroundColor: Colors.mintDim },
  chipLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  textInput: {
    fontFamily: Fonts.body, fontSize: 15, color: Colors.ink900,
    paddingHorizontal: 16, paddingVertical: 14,
    minHeight: 48,
  },
  incomeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  currencyLabel: { fontFamily: Fonts.displayMedium, fontSize: 16, color: Colors.ink500, marginRight: 8 },
  incomeInput: { flex: 1, fontFamily: Fonts.display, fontSize: 22, color: Colors.ink900, height: 56 },
  incomeHint: { fontFamily: Fonts.body, fontSize: 12, color: Colors.reject, marginTop: 6 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
});
