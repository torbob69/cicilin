import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loanService } from "@/services/loans";
import { parseApiError } from "@/utils/api";

export default function WaitingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, intent, tenure, pin } = useLocalSearchParams<{
    amount: string; intent: string; tenure: string; pin: string;
  }>();

  const pulse = useRef(new Animated.Value(1)).current;
  const hasRun = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const submit = async () => {
      try {
        const res = await loanService.apply({
          loan_amnt: Number(amount),
          loan_intent: intent,
          tenure_months: Number(tenure),
          pin,
        });
        const loan = res.data;
        router.replace({
          pathname: "/(tabs)/apply/result",
          params: {
            status: loan.loan_status,
            confidence: String(loan.confidence ?? ""),
            loanId: String(loan.id),
            shap: JSON.stringify(loan.shap_explanation ?? []),
          },
        });
      } catch (err: any) {
        router.replace({
          pathname: "/(tabs)/apply/result",
          params: { status: "error", message: parseApiError(err, "Application failed") },
        });
      }
    };

    submit();
  }, []);

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-canvas-soft items-center justify-center px-xl"
    >
      <Animated.View
        style={{ transform: [{ scale: pulse }] }}
        className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-2xl"
      >
        <Ionicons name="flash" size={36} color="#0e0f0c" />
      </Animated.View>
      <Text className="text-2xl font-sans-black text-ink mb-sm">Analyzing…</Text>
      <Text className="text-base text-body text-center">
        Our ML model is evaluating your loan application. This takes just a moment.
      </Text>
    </View>
  );
}
