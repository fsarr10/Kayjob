import { Stack } from "expo-router";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerShadowVisible: false, headerTintColor: colors.ink, headerTitleStyle: { fontWeight: "900" }, contentStyle: { backgroundColor: colors.paper } }}>
      <Stack.Screen name="index" options={{ title: "KayJob" }} />
      <Stack.Screen name="services/index" options={{ title: "Services" }} />
      <Stack.Screen name="missions/index" options={{ title: "Missions" }} />
      <Stack.Screen name="orders/index" options={{ title: "Commandes" }} />
      <Stack.Screen name="messages/index" options={{ title: "Messages" }} />
      <Stack.Screen name="portfolio/index" options={{ title: "Portfolio" }} />
      <Stack.Screen name="account/index" options={{ title: "Compte" }} />
      <Stack.Screen name="admin/index" options={{ title: "Admin" }} />
    </Stack>
  );
}
