import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RankColors } from '../constants/colors';

interface Props {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
}

const RANK_EMOJI: Record<string, string> = {
  Ruby: '💎',
  Diamond: '🔷',
  Platinum: '🌟',
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
  Iron: '⚙️',
};

export default function RankBadge({ rank, size = 'md' }: Props) {
  const colors = RankColors[rank] ?? RankColors.Iron;
  const sizes = { sm: 28, md: 40, lg: 100 };
  const dim = sizes[size];
  const fontSize = size === 'lg' ? 40 : size === 'md' ? 18 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 4,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={{ fontSize }}>{RANK_EMOJI[rank] ?? '⚙️'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
