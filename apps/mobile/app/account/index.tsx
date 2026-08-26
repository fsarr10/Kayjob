import { Mail, Phone, ShieldCheck } from "lucide-react-native";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { AccentCard, Avatar, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { cities, services } from "../../src/data";
import { colors, radii, space } from "../../src/theme";
import { requestOtp, verifyOtp } from "../../src/api";

export default function AccountScreen() {
  const student = services[0];
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const sendOtp = async () => { try { const result = await requestOtp(destination); setSent(true); if (result.devCode) Alert.alert("Code de test", result.devCode); } catch (error) { Alert.alert("Connexion impossible", error instanceof Error ? error.message : "Réessaie plus tard"); } };
  const confirmOtp = async () => { try { await verifyOtp(destination, code); Alert.alert("Compte sécurisé", "Tu es maintenant connecté à KayJob."); } catch (error) { Alert.alert("Code invalide", error instanceof Error ? error.message : "Vérifie le code"); } };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Compte" action="Sécurisé" />
          <AccentCard icon="account">
            <Text style={local.heroTitle}>Un seul compte pour commander et vendre.</Text>
            <Text style={local.heroCopy}>Téléphone, email, ville, vérification étudiant et portfolio public.</Text>
          </AccentCard>

          <Card>
            <Text style={local.title}>Inscription rapide</Text>
            <View style={local.inputRow}>
              <Phone color={colors.green} size={18} />
              <TextInput value={destination} onChangeText={setDestination} placeholder="+221 77 000 00 00" placeholderTextColor="#7b8984" style={local.input} autoCapitalize="none" />
            </View>
            <View style={local.inputRow}>
              <Mail color={colors.green} size={18} />
              <TextInput placeholder="email@universite.sn" placeholderTextColor="#7b8984" style={local.input} editable={false} />
            </View>
            {!sent ? <PrimaryButton label="Recevoir le code OTP" icon="shield" onPress={sendOtp} /> : <><View style={local.inputRow}><ShieldCheck color={colors.green} size={18} /><TextInput value={code} onChangeText={setCode} placeholder="Code à 6 chiffres" keyboardType="number-pad" style={local.input} /></View><PrimaryButton label="Confirmer la connexion" icon="shield" onPress={confirmOtp} /></>}
          </Card>

          <Card>
            <View style={local.profileTop}>
              <Avatar name={student.name} />
              <View style={local.main}>
                <Text style={local.title}>kayjob.sn/{student.pseudo}</Text>
                <Text style={shared.meta}>{student.name} · {student.city} · {student.category}</Text>
              </View>
            </View>
            <View style={local.badges}>
              <Badge label="Identité vérifiée" />
              <Badge label={`SamaScore ${student.score}/100`} tone="amber" />
            </View>
          </Card>

          <Card>
            <View style={local.profileTop}>
              <ShieldCheck color={colors.green} size={22} />
              <Text style={local.title}>Couverture nationale</Text>
            </View>
            <Text style={shared.meta}>{cities.join(" · ")}</Text>
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
  input: { flex: 1, color: colors.ink },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 }
});
