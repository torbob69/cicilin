import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  padding?: number;
}

export default function GlassCard({ children, style, radius = 28, padding = 20 }: GlassCardProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={14}
        tint="dark"
        style={[
          styles.blurBase,
          { borderRadius: radius, overflow: 'hidden' },
          style as ViewStyle,
        ]}
      >
        <View
          style={[
            styles.overlay,
            { borderRadius: radius, padding },
          ]}
        >
          {children}
        </View>
      </BlurView>
    );
  }

  // Android fallback — solid dark surface with glass border
  return (
    <View
      style={[
        styles.androidCard,
        { borderRadius: radius, padding },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blurBase: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  overlay: {
    backgroundColor: Colors.glass,
  },
  androidCard: {
    backgroundColor: 'rgba(28,28,28,0.92)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});
