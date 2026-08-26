import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Metric, Page, PrimaryButton, QuickNav, SectionTitle, styles as shared } from "../src/components";
import { services, missions, orders } from "../src/data";
import { KayJobLogo } from "../src/Logo";
import { colors, radii } from "../src/theme";

export default function HomeScreen() {
  return (
    <ScrollView style={local.screen}>
      <StatusBar style="dark" />
      <Page>
        <View style={local.header}>
          <KayJobLogo />
          <View style={local.headerText}>
            <Text style={local.brand}>KayJob</Text>
            <Text style={local.subtitle}>Talents étudiants au Sénégal</Text>
          </View>
        </View>

        <View style={local.heroPanel}>
          <Text style={local.heroTitle}>Ton talent peut devenir ton premier revenu.</Text>
          <Text style={local.heroCopy}>Services, missions, portfolio public et paiement sécurisé.</Text>
          <TextInput placeholder="Compétence, ville, budget..." placeholderTextColor="#7b8984" style={local.input} />
          <PrimaryButton label="Rechercher" />
        </View>

        <QuickNav />

        <View style={local.stats}>
          <Metric value="14" label="régions" />
          <Metric value={String(services.length)} label="talents" />
          <Metric value={String(orders.length)} label="commandes" />
        </View>

        <SectionTitle title="Services recommandés" action="Tout voir" />
        {services.slice(0, 3).map((service) => (
          <Card key={service.id}>
            <Text style={local.cardTitle}>{service.title}</Text>
            <Text style={shared.meta}>{service.name} · {service.city} · {service.mode}</Text>
            <View style={local.row}><Text style={local.price}>{service.price}</Text><Text style={local.score}>SamaScore {service.score}/100</Text></View>
            <Text style={shared.meta}>{service.work}</Text>
          </Card>
        ))}

        <SectionTitle title="Missions ouvertes" action="Publier" />
        {missions.slice(0, 2).map((mission) => (
          <Card key={mission.id}>
            <Text style={local.cardTitle}>{mission.title}</Text>
            <Text style={shared.meta}>{mission.city} · {mission.mode} · {mission.offers} devis</Text>
            <Text style={local.price}>{mission.budget}</Text>
          </Card>
        ))}
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 22 },
  headerText: { flex: 1 },
  brand: { fontSize: 30, fontWeight: "900", color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted },
  heroPanel: { gap: 14, padding: 18, borderRadius: radii.lg, backgroundColor: colors.navy },
  heroTitle: { fontSize: 28, lineHeight: 33, fontWeight: "900", color: "#fff" },
  heroCopy: { color: colors.line, lineHeight: 20 },
  input: { minHeight: 48, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff", color: colors.ink },
  stats: { flexDirection: "row", gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: colors.ink },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  price: { fontWeight: "900", color: colors.ink },
  score: { color: colors.greenDark, fontWeight: "900" }
});
