import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const KYC_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Verification', color: Colors.amber },
  approved: { label: 'Verified', color: Colors.approve },
  rejected: { label: 'Verification Failed', color: Colors.reject },
};

const HOME_LABEL: Record<string, string> = {
  RENT: 'Renting',
  OWN: 'Own Home',
  MORTGAGE: 'Mortgage',
  OTHER: 'Other',
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={Colors.ink400} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MissingBanner({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.missingRow} onPress={onPress} activeOpacity={0.7}>
      <Feather name="alert-circle" size={14} color={Colors.amber} />
      <Text style={styles.missingText}>{label} — tap to fill in</Text>
      <Feather name="chevron-right" size={14} color={Colors.ink400} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore(s => s.logout);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    api.get('/users/me')
      .then(r => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Refresh when navigating back from edit screen
  useFocusEffect(useCallback(() => { fetchUser(); }, []));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initials = user?.full_name
    ?.split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('') ?? '?';

  const kycStatus = user?.kyc_status ?? 'pending';
  const kycMeta = KYC_STATUS[kycStatus] ?? KYC_STATUS.pending;

  const formatDob = (dob: string | null) => {
    if (!dob) return null;
    const d = new Date(dob);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatIDR = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const goEdit = () => router.push('/edit-profile');

  const missingPersonal = !user?.date_of_birth || !user?.home_ownership;
  const missingEmployment = !user?.employment?.annual_income || !user?.employment?.emp_length;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.mint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + edit button */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.kycBadge, { backgroundColor: `${kycMeta.color}1A` }]}>
            <Feather
              name={kycStatus === 'approved' ? 'check-circle' : 'clock'}
              size={12}
              color={kycMeta.color}
            />
            <Text style={[styles.kycLabel, { color: kycMeta.color }]}>{kycMeta.label}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={goEdit} activeOpacity={0.7}>
            <Feather name="edit-2" size={13} color={Colors.ink700} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Info */}
      <Text style={styles.sectionLabel}>Personal Info</Text>
      {missingPersonal && <MissingBanner label="Some personal info is missing" onPress={goEdit} />}
      <GlassCard padding={0}>
        <InfoRow icon="phone" label="Phone" value={user?.phone} />
        <InfoRow icon="mail" label="Email" value={user?.email} />
        <InfoRow icon="calendar" label="Date of Birth" value={formatDob(user?.date_of_birth)} />
        <InfoRow icon="home" label="Home Ownership" value={HOME_LABEL[user?.home_ownership] ?? user?.home_ownership} />
        <InfoRow icon="map-pin" label="Address" value={user?.address} />
      </GlassCard>

      {/* Employment */}
      <Text style={styles.sectionLabel}>Employment</Text>
      {missingEmployment && <MissingBanner label="Employment info required for loan applications" onPress={goEdit} />}
      <GlassCard padding={0}>
        <InfoRow icon="briefcase" label="Employer" value={user?.employment?.employer_name} />
        <InfoRow icon="award" label="Job Title" value={user?.employment?.job_title} />
        <InfoRow
          icon="clock"
          label="Years Employed"
          value={user?.employment?.emp_length != null ? `${user.employment.emp_length} years` : null}
        />
        <InfoRow
          icon="dollar-sign"
          label="Annual Income"
          value={user?.employment?.annual_income != null ? formatIDR(user.employment.annual_income) : null}
        />
      </GlassCard>

      {/* Documents */}
      <Text style={styles.sectionLabel}>Documents</Text>
      <GlassCard padding={0}>
        <View style={styles.docRow}>
          <View style={styles.docIcon}>
            <Feather name="file-text" size={17} color={Colors.mint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docLabel}>KTP (National ID)</Text>
            <Text style={styles.docSub}>{kycStatus === 'approved' ? 'Verified ✓' : 'Not yet uploaded'}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Dev: approve KYC */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.devBtn}
          activeOpacity={0.7}
          onPress={() => {
            api.post('/users/dev/approve-kyc')
              .then(() => Alert.alert('Dev', 'KYC approved! You can now apply for a loan.'))
              .catch((e: any) => Alert.alert('Error', e.response?.data?.detail ?? 'Failed'));
          }}
        >
          <Feather name="zap" size={14} color={Colors.amber} />
          <Text style={styles.devBtnText}>Dev: Approve KYC</Text>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
        <Feather name="log-out" size={16} color={Colors.reject} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black },
  screen: { flex: 1, backgroundColor: Colors.black },
  content: { paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.mintDim,
    borderWidth: 2, borderColor: Colors.mint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 28, color: Colors.mint },
  name: { fontFamily: Fonts.display, fontSize: 22, color: Colors.ink900 },
  email: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink500, marginTop: 4, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  kycLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.ink700 },
  sectionLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 24 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.amberDim, borderRadius: Radius.md, marginBottom: 8 },
  missingText: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.amber },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.ink400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontFamily: Fonts.body, fontSize: 14, color: Colors.ink900 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  docIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.mintDim, alignItems: 'center', justifyContent: 'center' },
  docLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.ink900 },
  docSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink500, marginTop: 2 },
  devBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amberDim, backgroundColor: Colors.amberDim },
  devBtnText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.amber },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.coralDim, backgroundColor: Colors.coralDim },
  logoutText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.reject },
});
