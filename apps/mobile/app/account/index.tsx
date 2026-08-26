import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { cities, services } from "../../src/data";
import { colors, radii } from "../../src/theme";

export default function AccountScreen() {
  const student = services[0];

  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Compte" action="OTP" />
        <Card>
          <Text style={local.title}>Inscription rapide</Text>
          <TextInput placeholder="+221 77 000 00 00" placeholderTextColor="#7b8984" style={local.input} />
          <TextInput placeholder="Ville ou région" placeholderTextColor="#7b8984" style={local.input} />
          <PrimaryButton label="Recevoir le code OTP" />
        </Card>

        <Card>
          <Text style={local.title}>Profil prestataire</Text>
          <Text style={shared.meta}>kayjob.sn/{student.pseudo}</Text>
          <Text style={shared.meta}>{student.name} · {student.city} · {student.category}</Text>
          <View style={local.badgeRow}>
            <Text style={local.badge}>Identité vérifiée</Text>
            <Text style={local.badge}>SamaScore {student.score}/100</Text>
          </View>
        </Card>

        <Card>
          <Text style={local.title}>Villes couvertes</Text>
          <Text style={shared.meta}>{cities.join(" · ")}</Text>
        </Card>
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  input: { minHeight: 48, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, color: colors.ink },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.sm, overflow: "hidden", backgroundColor: "#e3f4ea", color: colors.greenDark, fontWeight: "900" }
});
