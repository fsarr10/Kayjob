import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerTitle: "KayJob", headerStyle: { backgroundColor: "#fbfcfa" }, headerTintColor: "#17211d" }} />;
}
