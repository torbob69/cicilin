import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '../../constants/theme';

interface Props {
  score: number;
  status: 'approved' | 'review' | 'rejected';
  size?: number;
}

export function ScoreRing({ score, status, size = 140 }: Props) {
  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = status === 'approved' ? Colors.approve : status === 'review' ? Colors.review : Colors.reject;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={Colors.ink100} strokeWidth={10} />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: Fonts.display, fontSize: 32, color: Colors.ink900 }}>{score}</Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.ink500 }}>Trust score</Text>
      </View>
    </View>
  );
}
