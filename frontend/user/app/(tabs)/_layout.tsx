import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="apply" options={{ title: 'Apply' }} />
      <Tabs.Screen name="status" options={{ title: 'Status' }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
