import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore(s => s.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.access_token, res.data.refresh_token);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.black }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.heading}>Welcome back.</Text>
          <Text style={styles.sub}>Sign in to your account</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="john@doe.com" placeholderTextColor={Colors.ink400}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.ink400}
            value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Sign in" onPress={submit} variant="primary" size="lg" fullWidth loading={loading} style={{ marginTop: 8 }} />

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{ color: Colors.mint }}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 100 },
  header: { marginBottom: 40 },
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
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500 },
});
