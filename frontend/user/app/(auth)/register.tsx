import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      useAuthStore.getState().setPendingPhone(form.phone);
      router.push({ pathname: '/(auth)/verify-otp', params: { devOtp: res.data.dev_otp } });
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.black }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.sub}>Start your loan journey</Text>
        </View>

        {[
          { key: 'full_name', label: 'Full name', placeholder: 'John Doe', autoComplete: 'name' as const },
          { key: 'email', label: 'Email', placeholder: 'john@doe.com', autoComplete: 'email' as const, keyboardType: 'email-address' as const },
          { key: 'phone', label: 'Phone', placeholder: '+62 812 3456 7890', autoComplete: 'tel' as const, keyboardType: 'phone-pad' as const },
          { key: 'password', label: 'Password', placeholder: '••••••••', secure: true },
        ].map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.ink400}
              value={(form as any)[f.key]}
              onChangeText={v => set(f.key, v)}
              secureTextEntry={f.secure}
              autoComplete={f.autoComplete}
              keyboardType={f.keyboardType}
              autoCapitalize="none"
            />
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Create account" onPress={submit} variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: 8 }} />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account? <Text style={{ color: Colors.mint }}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },
  header: { marginBottom: 36 },
  heading: { fontFamily: Fonts.display, fontSize: 34, color: Colors.ink900 },
  sub: { fontFamily: Fonts.body, fontSize: 16, color: Colors.ink500, marginTop: 6 },
  field: { marginBottom: 18 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.ink500, marginBottom: 8 },
  input: {
    height: 52, borderRadius: Radius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, fontFamily: Fonts.body, fontSize: 15, color: Colors.ink900,
  },
  error: { fontFamily: Fonts.body, fontSize: 13, color: Colors.reject, marginBottom: 12, textAlign: 'center' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500 },
});
