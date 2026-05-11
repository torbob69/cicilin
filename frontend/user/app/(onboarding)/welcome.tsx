import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, Radius } from '../../constants/theme';

function ShieldIcon() {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={Colors.mint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l9 4v6c0 5.5-4 9.5-9 10-5-.5-9-4.5-9-10V6l9-4z" />
      <Path d="M8.5 12l2.5 2.5L16 9.5" />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroShape}>
          <ShieldIcon />
        </View>
        <Text style={styles.heading}>Borrow with{'\n'}confidence.</Text>
        <Text style={styles.sub}>
          A quieter way to check your loan eligibility.{'\n'}
          Answer a few questions, see your decision in seconds.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Get started" onPress={() => router.push('/(onboarding)/features')} variant="primary" size="lg" fullWidth />
        <Button label="I already have an account" onPress={() => router.push('/(auth)/login')} variant="ghost" size="lg" fullWidth style={{ marginTop: 10 }} />
        <View style={styles.trust}>
          <Text style={styles.trustText}>Bank-level encryption · Never shared</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  heroShape: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: Colors.mintDim,
    borderWidth: 1, borderColor: 'rgba(111,207,151,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heading: {
    fontFamily: Fonts.display, fontSize: 38, color: Colors.ink900,
    textAlign: 'center', lineHeight: 46,
  },
  sub: {
    fontFamily: Fonts.body, fontSize: 16, color: Colors.ink500,
    textAlign: 'center', lineHeight: 24,
  },
  footer: { paddingBottom: 48, gap: 4 },
  trust: { alignItems: 'center', marginTop: 16 },
  trustText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.ink400 },
});
