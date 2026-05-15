import { Tabs } from "expo-router";
import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  return (
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
  );
}
