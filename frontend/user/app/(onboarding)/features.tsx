import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts, Radius } from '../../constants/theme';

const slides = [
  {
    title: 'Instant decisions',
    body: 'Our model evaluates your application against thousands of patterns and returns a result in under three seconds.',
    tone: Colors.mintDim,
    icon: (
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Colors.mint} strokeWidth={1.5} strokeLinecap="round">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </Svg>
    ),
  },
  {
    title: 'Transparent scoring',
    body: 'See exactly which factors helped or hurt your application — no black-box decisions, no surprises.',
    tone: Colors.skyDim,
    icon: (
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Colors.sky} strokeWidth={1.5} strokeLinecap="round">
        <Path d="M12 2l9 4v6c0 5.5-4 9.5-9 10-5-.5-9-4.5-9-10V6l9-4z" />
        <Path d="M8.5 12l2.5 2.5L16 9.5" />
      </Svg>
    ),
  },
  {
    title: 'Private by design',
    body: 'Your information is encrypted end-to-end. No hard credit inquiry. Cancel anytime.',
    tone: Colors.mintDim,
    icon: (
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Colors.mint} strokeWidth={1.5} strokeLinecap="round">
        <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
        <Path d="M7 11V7a5 5 0 0110 0v4" />
      </Svg>
    ),
  },
];

export default function FeaturesScreen() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const s = slides[slide];

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(auth)/register')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: s.tone }]}>
          {s.icon}
        </View>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.body}>{s.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={slide < slides.length - 1 ? 'Continue' : 'Start application'}
          onPress={() => slide < slides.length - 1 ? setSlide(slide + 1) : router.replace('/(auth)/register')}
          variant="primary" size="lg" fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: 24 },
  skip: { alignSelf: 'flex-end', paddingTop: 56, paddingBottom: 12 },
  skipText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.ink500 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  iconBox: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.ink900, textAlign: 'center' },
  body: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  footer: { paddingBottom: 48, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ink100 },
  dotActive: { width: 20, backgroundColor: Colors.mint },
});
