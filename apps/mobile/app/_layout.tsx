import { Tabs } from "expo-router";
import { BriefcaseBusiness, FolderKanban, Home, MessageCircle, Search } from "lucide-react-native";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginBottom: 4 },
      tabBarStyle: { height: 76, paddingTop: 8, backgroundColor: colors.surface, borderTopColor: colors.line },
      tabBarHideOnKeyboard: true
    }}>
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2.4} /> }} />
      <Tabs.Screen name="services/index" options={{ title: "Talents", tabBarIcon: ({ color, size }) => <Search color={color} size={size} strokeWidth={2.4} /> }} />
      <Tabs.Screen name="missions/index" options={{ title: "Missions", tabBarIcon: ({ color, size }) => <BriefcaseBusiness color={color} size={size} strokeWidth={2.4} /> }} />
      <Tabs.Screen name="messages/index" options={{ title: "Messages", tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} strokeWidth={2.4} /> }} />
      <Tabs.Screen name="portfolio/index" options={{ title: "Portfolio", tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} strokeWidth={2.4} /> }} />
      <Tabs.Screen name="orders/index" options={{ href: null }} />
      <Tabs.Screen name="account/index" options={{ href: null }} />
      <Tabs.Screen name="admin/index" options={{ href: null }} />
      <Tabs.Screen name="preview" options={{ href: null }} />
    </Tabs>
  );
}
