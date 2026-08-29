import { Mail, Phone, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AccentCard, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { getSessionToken, requestOtp, verifyOtp } from "../../src/api";
import { colors, radii, space } from "../../src/theme";

export default function AccountScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [connected, setConnected] = useState(Boolean(getSessionToken()));

  const sendOtp = async () => {
    try {
      const result = await requestOtp(destination.trim());
      setSent(true);
      if (result.devCode) Alert.alert("Code de test local", result.devCode);
    } catch (error) {
      Alert.alert("Connexion impossible", error instanceof Error ? error.message : "Réessaie plus tard");
    }
  };

  const confirmOtp = async () => {
    try {
      await verifyOtp(destination.trim(), code.trim());
      setConnected(true);
      Alert.alert("Compte sécurisé", "Tu es maintenant connecté à KayJob.");
    } catch (error) {
      Alert.alert("Code invalide", error instanceof Error ? error.message : "Vérifie le code");
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Compte" action={connected ? "Connecté" : "Sécurisé"} />
          <AccentCard icon="account">
            <Text style={local.heroTitle}>Un seul compte pour commander et vendre.</Text>
            <Text style={local.heroCopy}>La session vient de l’API KayJob et toutes les données sont synchronisées avec Neon.</Text>
          </AccentCard>
          <PrimaryButton label="Ouvrir la page de connexion" icon="shield" onPress={() => router.push("/login")} />

          <Card>
            <Text style={local.title}>{connected ? "Session active" : "Connexion OTP"}</Text>
            {connected ? <Text style={shared.meta}>Ton compte est connecté à l’API. Les commandes, missions et services sont chargés depuis la base.</Text> : null}
            {!connected ? (
              <>
                <View style={local.inputRow}>
                  {destination.includes("@") ? <Mail color={colors.green} size={18} /> : <Phone color={colors.green} size={18} />}
                  <TextInput value={destination} onChangeText={setDestination} placeholder="+221 77 000 00 00 ou email" placeholderTextColor="#7b8984" style={local.input} autoCapitalize="none" />
                </View>
                {!sent ? <PrimaryButton label="Recevoir le code OTP" icon="shield" onPress={sendOtp} /> : <><View style={local.inputRow}><ShieldCheck color={colors.green} size={18} /><TextInput value={code} onChangeText={setCode} placeholder="Code à 6 chiffres" keyboardType="number-pad" style={local.input} /></View><PrimaryButton label="Confirmer la connexion" icon="shield" onPress={confirmOtp} /></>}
              </>
            ) : null}
          </Card>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  inputRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, color: colors.ink }
});
