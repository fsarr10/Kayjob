import { Mail, Phone, ShieldCheck } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AccentCard, Avatar, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { cities, services } from "../../src/data";
import { colors, radii, space } from "../../src/theme";

export default function AccountScreen() {
  const student = services[0];

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
              <TextInput placeholder="+221 77 000 00 00" placeholderTextColor="#7b8984" style={local.input} />
            </View>
            <View style={local.inputRow}>
              <Mail color={colors.green} size={18} />
              <TextInput placeholder="email@universite.sn" placeholderTextColor="#7b8984" style={local.input} />
            </View>
            <PrimaryButton label="Recevoir le code OTP" icon="shield" />
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
