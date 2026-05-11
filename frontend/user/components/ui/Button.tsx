import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', fullWidth, loading, disabled, style }: Props) {
  const isLg = size === 'lg';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        isLg ? styles.lg : styles.md,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        fullWidth && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? Colors.mint : Colors.black} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel, variant === 'danger' && styles.dangerLabel, isLg && styles.lgLabel]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { height: 44, paddingHorizontal: 20 },
  lg: { height: 54, paddingHorizontal: 28 },
  full: { width: '100%' },
  primary: { backgroundColor: Colors.mint },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
  danger: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.reject },
  disabled: { opacity: 0.4 },
  label: { fontFamily: Fonts.displayMedium, fontSize: 15, color: Colors.black },
  lgLabel: { fontSize: 16 },
  ghostLabel: { color: Colors.ink700 },
  dangerLabel: { color: Colors.reject },
});
