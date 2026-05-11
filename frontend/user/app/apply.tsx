import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Colors, Fonts, Radius, Shadow } from '../constants/theme';
import { api } from '../services/api';

const INTENTS = [
  { value: 'PERSONAL', label: 'Personal', icon: 'user' as const, desc: 'Personal expenses' },
  { value: 'EDUCATION', label: 'Education', icon: 'book' as const, desc: 'School & courses' },
  { value: 'MEDICAL', label: 'Medical', icon: 'activity' as const, desc: 'Health expenses' },
  { value: 'VENTURE', label: 'Business', icon: 'briefcase' as const, desc: 'Business ventures' },
  { value: 'HOMEIMPROVEMENT', label: 'Home', icon: 'home' as const, desc: 'Home renovation' },
  { value: 'DEBTCONSOLIDATION', label: 'Debt', icon: 'refresh-cw' as const, desc: 'Consolidate debts' },
];

const TENURES = [3, 6, 12, 24, 36];

const formatIDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyle.dot,
            i === step - 1 && dotStyle.active,
            i < step - 1 && dotStyle.done,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyle = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ink100 },
  active: { width: 20, backgroundColor: Colors.mint },
  done: { backgroundColor: Colors.mintText },
});

export default function ApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [amountStr, setAmountStr] = useState('');
  const [intent, setIntent] = useState('');
  const [tenure, setTenure] = useState(0);
  const [loading, setLoading] = useState(false);

  const rawAmount = parseInt(amountStr.replace(/[^0-9]/g, '') || '0', 10);
  const canNext1 = rawAmount >= 1_000_000 && rawAmount <= 50_000_000;
  const canNext2 = !!intent && tenure > 0;

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setAmountStr(digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits, 10)) : '');
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/loans/apply', {
        loan_amnt: rawAmount,
        loan_intent: intent,
        tenure_months: tenure,
      });
      router.replace({
        pathname: '/processing',
        params: { result: JSON.stringify(res.data) },
      });
    } catch (e: any) {
      Alert.alert('Application Failed', e.response?.data?.detail || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const selectedIntent = INTENTS.find(i => i.value === intent);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(s => s - 1) : router.back())}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={Colors.ink700} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <StepDots step={step} total={3} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Amount */}
        {step === 1 && (
          <>
            <Text style={styles.heading}>How much{'\n'}do you need?</Text>
            <Text style={styles.sub}>Between Rp 1.000.000 – Rp 50.000.000</Text>

            <View style={styles.amountWrap}>
              <Text style={styles.currencyLabel}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                value={amountStr}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                placeholder="5.000.000"
                placeholderTextColor={Colors.ink400}
                maxLength={16}
              />
            </View>

            {rawAmount > 0 && (
              <Text style={[styles.amountHint, { color: canNext1 ? Colors.mint : Colors.reject }]}>
                {canNext1
                  ? formatIDR(rawAmount)
                  : rawAmount < 1_000_000
                  ? 'Minimum Rp 1.000.000'
                  : 'Maximum Rp 50.000.000'}
              </Text>
            )}

            <View style={styles.presets}>
              {[2_000_000, 5_000_000, 10_000_000, 20_000_000].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.preset, rawAmount === p && styles.presetActive]}
                  onPress={() => handleAmountChange(String(p))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetLabel, rawAmount === p && { color: Colors.mint }]}>
                    {(p / 1_000_000).toFixed(0)}jt
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 2: Intent + Tenure */}
        {step === 2 && (
          <>
            <Text style={styles.heading}>What's it for?</Text>
            <Text style={styles.sub}>Choose the purpose of your loan</Text>

            <View style={styles.intentGrid}>
              {INTENTS.map(item => {
                const active = intent === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.intentCard, active && styles.intentCardActive]}
                    onPress={() => setIntent(item.value)}
                    activeOpacity={0.7}
                  >
                    <Feather name={item.icon} size={22} color={active ? Colors.mint : Colors.ink500} />
                    <Text style={[styles.intentLabel, active && { color: Colors.mint }]}>{item.label}</Text>
                    <Text style={styles.intentDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sub, { marginTop: 28, marginBottom: 14 }]}>Repayment period</Text>
            <View style={styles.tenureRow}>
              {TENURES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tenureChip, tenure === t && styles.tenureChipActive]}
                  onPress={() => setTenure(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tenureLabel, tenure === t && { color: Colors.mint }]}>
                    {t}mo
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <>
            <Text style={styles.heading}>Review your{'\n'}application</Text>
            <Text style={styles.sub}>Confirm the details before submitting</Text>

            <GlassCard padding={0} style={{ marginBottom: 12 }}>
              {[
                { label: 'Loan Amount', value: formatIDR(rawAmount) },
                { label: 'Purpose', value: selectedIntent?.label ?? intent },
                { label: 'Tenure', value: `${tenure} months` },
                { label: 'Est. Monthly', value: formatIDR(Math.ceil(rawAmount / tenure)) },
              ].map((row, idx, arr) => (
                <View key={row.label} style={[styles.reviewRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}
            </GlassCard>

            <GlassCard padding={16} style={{ backgroundColor: Colors.mintDim }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Feather name="zap" size={15} color={Colors.mint} style={{ marginTop: 1 }} />
                <Text style={styles.aiNote}>
                  Our AI evaluates your profile instantly. Interest rate and loan grade are set based on your credit score after submission.
                </Text>
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {step < 3 ? (
          <Button
            label="Continue"
            onPress={() => setStep(s => s + 1)}
            variant="primary"
            size="lg"
            fullWidth
            disabled={step === 1 ? !canNext1 : !canNext2}
          />
        ) : (
          <Button
            label="Submit Application"
            onPress={submit}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  heading: { fontFamily: Fonts.display, fontSize: 30, color: Colors.ink900, lineHeight: 38, marginBottom: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500, marginBottom: 24 },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 20, marginBottom: 12,
  },
  currencyLabel: { fontFamily: Fonts.displayMedium, fontSize: 18, color: Colors.ink500, marginRight: 10 },
  amountInput: { flex: 1, fontFamily: Fonts.display, fontSize: 30, color: Colors.ink900, height: 72 },
  amountHint: { fontFamily: Fonts.bodyMedium, fontSize: 13, textAlign: 'center', marginBottom: 24 },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1, paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  presetActive: { borderColor: Colors.mint, backgroundColor: Colors.mintDim },
  presetLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500 },
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  intentCard: {
    width: '47%', padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    gap: 6,
  },
  intentCardActive: { borderColor: Colors.mint, backgroundColor: Colors.mintDim },
  intentLabel: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.ink700 },
  intentDesc: { fontFamily: Fonts.body, fontSize: 11, color: Colors.ink400 },
  tenureRow: { flexDirection: 'row', gap: 8 },
  tenureChip: {
    flex: 1, paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  tenureChipActive: { borderColor: Colors.mint, backgroundColor: Colors.mintDim },
  tenureLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500 },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  reviewLabel: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500 },
  reviewValue: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Colors.ink900 },
  aiNote: { fontFamily: Fonts.body, fontSize: 13, color: Colors.mintText, flex: 1, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
});
