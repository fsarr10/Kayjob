import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#f7faf8" }, headerTintColor: "#151b19", headerTitleStyle: { fontWeight: "900" } }}>
      <Stack.Screen name="index" options={{ title: "KayJob" }} />
      <Stack.Screen name="services/index" options={{ title: "Services" }} />
      <Stack.Screen name="missions/index" options={{ title: "Missions" }} />
      <Stack.Screen name="orders/index" options={{ title: "Commandes" }} />
      <Stack.Screen name="portfolio/index" options={{ title: "Portfolio" }} />
    </Stack>
  );
}
