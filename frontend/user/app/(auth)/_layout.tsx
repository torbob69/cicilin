import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function AuthLayout() {
  const { isAuthenticated, isNewUser, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (isAuthenticated && !isNewUser) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 220 }} />;
}
