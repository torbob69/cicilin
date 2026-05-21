import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { TabBar } from "@/components/TabBar";
import { LoanDetailSheet } from "@/components/LoanDetailSheet";
import { useAuthStore } from "@/store/auth";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="status" />
        <Tabs.Screen name="apply" options={{ href: null }} />
        <Tabs.Screen name="quests" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="leaderboard" options={{ href: null }} />
      </Tabs>
      <LoanDetailSheet />
    </View>
  );
}
