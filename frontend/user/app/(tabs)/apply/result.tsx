import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoanStore } from '../../../store/loan';
import { Colors } from '../../../constants/colors';
import { formatIDR } from '../../../constants/helpers';

export default function ApplyResultScreen() {
  const router = useRouter();
  const { draft, reset } = useLoanStore();
  const result = draft.result;

  function goHome() {
    reset();
    router.replace('/(tabs)/');
  }

  if (!result) {
    goHome();
    return null;
  }

  // Error from network
  if (result.error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: Colors.red }]}>
            <Feather name="x" size={40} color={Colors.red} />
          </View>
          <Text style={styles.title}>Pengajuan Gagal</Text>
          <Text style={styles.subtitle}>{result.error}</Text>
          <TouchableOpacity style={styles.btn} onPress={goHome} activeOpacity={0.85}>
            <Text style={styles.btnText}>Kembali ke Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = result.loan_status;
  const isApproved = ['approved', 'disbursed'].includes(status);
  const isManualReview = status === 'manual_review';
  const isRejected = status === 'rejected';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {isApproved && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: Colors.greenGlow, borderColor: Colors.green }]}>
              <Feather name="check" size={40} color={Colors.green} />
            </View>
            <Text style={styles.title}>Selamat! 🎉</Text>
            <Text style={styles.subtitle}>Pinjaman kamu disetujui sebesar</Text>
            <Text style={styles.amount}>{formatIDR(result.loan_amnt)}</Text>
            <Text style={styles.hint}>Dana akan segera dicairkan ke rekening kamu</Text>
            <TouchableOpacity style={styles.btn} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.btnText}>Kembali ke Home</Text>
            </TouchableOpacity>
          </>
        )}

        {isManualReview && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: Colors.orange }]}>
              <Feather name="clock" size={40} color={Colors.orange} />
            </View>
            <Text style={styles.title}>Dalam Review</Text>
            <Text style={styles.subtitle}>Pinjaman kamu lagi direview oleh admin kami</Text>
            <Text style={styles.hint}>Kami akan menghubungi kamu segera setelah review selesai</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.orange }]} onPress={goHome} activeOpacity={0.85}>
              <Text style={styles.btnText}>Kembali ke Home</Text>
            </TouchableOpacity>
          </>
        )}

        {isRejected && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: Colors.red }]}>
              <Feather name="x" size={40} color={Colors.red} />
            </View>
            <Text style={styles.title}>Maaf, Ditolak</Text>
            <Text style={styles.subtitle}>Pinjaman kamu tidak dapat disetujui saat ini</Text>
            {result.confidence && (
              <Text style={styles.hint}>Skor: {Math.round(result.confidence * 100)}%</Text>
            )}
            <Text style={[styles.hint, { marginTop: 8 }]}>
              Tingkatkan rank kamu untuk peluang lebih besar
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.surface2 }]} onPress={goHome} activeOpacity={0.85}>
              <Text style={[styles.btnText, { color: Colors.white }]}>Kembali ke Home</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  title: { color: Colors.white, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: Colors.gray, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  amount: { color: Colors.green, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginVertical: 12 },
  hint: { color: Colors.grayLight, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn: {
    backgroundColor: Colors.green, borderRadius: 999, height: 52,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: 32,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
