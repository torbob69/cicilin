import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '../constants/theme';

function BounceDot({ delay }: { delay: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: -10, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 380, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { transform: [{ translateY: y }] }]} />;
}

export default function ProcessingScreen() {
  const router = useRouter();
  const { result } = useLocalSearchParams<{ result: string }>();

  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace({ pathname: '/result', params: { result } });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.screen, { opacity }]}>
      <Animated.View style={[styles.ringWrap, { transform: [{ rotate: spin }, { scale }] }]}>
        <Svg width={180} height={180}>
          <Circle cx={90} cy={90} r={74} fill="none" stroke={Colors.ink100} strokeWidth={3} />
          <Circle
            cx={90} cy={90} r={74}
            fill="none"
            stroke={Colors.mint}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="110 465"
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Feather name="cpu" size={38} color={Colors.mint} />
        </View>
      </Animated.View>

      <Text style={styles.title}>Evaluating your profile</Text>
      <Text style={styles.sub}>
        Our AI is analyzing your application.{'\n'}This will only take a moment…
      </Text>

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((_, i) => (
          <BounceDot key={i} delay={i * 220} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', padding: 40 },
  ringWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 44 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.display, fontSize: 24, color: Colors.ink900, textAlign: 'center', marginBottom: 12 },
  sub: { fontFamily: Fonts.body, fontSize: 15, color: Colors.ink500, textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', gap: 10, marginTop: 36 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.mint },
});
