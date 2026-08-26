import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Bell, MapPin, Search, ShieldCheck, TrendingUp } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AccentCard, Avatar, Badge, Card, Metric, Page, PrimaryButton, QuickNav, Screen, SectionTitle, styles as shared } from "../src/components";
import { missions, orders, services } from "../src/data";
import { KayJobLogo } from "../src/Logo";
import { colors, radii, shadow, space } from "../src/theme";

export default function HomeScreen() {
  const topService = services[4] ?? services[0];

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <View style={local.header}>
            <View style={local.brandWrap}>
              <KayJobLogo />
              <View>
                <Text style={local.brand}>KayJob</Text>
                <Text style={local.subtitle}>Talents étudiants au Sénégal</Text>
              </View>
            </View>
            <View style={local.alertButton}><Bell color={colors.ink} size={19} /></View>
          </View>

          <AccentCard icon="spark">
            <Text style={local.eyebrow}>Marketplace nationale</Text>
            <Text style={local.heroTitle}>Ton talent peut devenir ton premier revenu.</Text>
            <Text style={local.heroCopy}>Trouve un étudiant vérifié, commande en escrow, puis suis la livraison depuis ton téléphone.</Text>
            <View style={local.searchBox}>
              <Search color={colors.green} size={18} />
              <TextInput placeholder="Logo, site web, cours, réparation..." placeholderTextColor="#7b8984" style={local.input} />
            </View>
            <View style={local.heroActions}>
              <PrimaryButton label="Rechercher" />
            </View>
          </AccentCard>

          <QuickNav />

          <View style={local.stats}>
            <Metric value="14" label="régions" tone="green" />
            <Metric value={String(services.length)} label="talents" />
            <Metric value={String(orders.length)} label="escrow" tone="blue" />
          </View>

          <SectionTitle title="Talent en avant" action="SamaScore" />
          <LinearGradient colors={["#ffffff", "#edf8f1"]} style={[local.featureCard, shadow]}>
            <View style={local.featureTop}>
              <Avatar name={topService.name} size={54} />
              <View style={local.featureMain}>
                <Text style={local.cardTitle}>{topService.title}</Text>
                <Text style={shared.meta}>{topService.name} · {topService.city}</Text>
              </View>
              <Badge label={`${topService.score}/100`} tone="amber" />
            </View>
            <View style={local.badges}>
              <Badge label={topService.mode} />
              <Badge label={topService.category} tone="blue" />
              <Badge label={`${topService.rating}/5`} tone="dark" />
            </View>
            <Text style={local.price}>{topService.price}</Text>
          </LinearGradient>

          <SectionTitle title="Missions ouvertes" action="Live" />
          {missions.slice(0, 2).map((mission) => (
            <Card key={mission.id}>
              <View style={local.missionRow}>
                <View style={local.missionIcon}><MapPin color={colors.green} size={18} /></View>
                <View style={local.featureMain}>
                  <Text style={local.cardTitle}>{mission.title}</Text>
                  <Text style={shared.meta}>{mission.city} · {mission.mode} · {mission.offers} devis</Text>
                </View>
                <Text style={local.price}>{mission.budget}</Text>
              </View>
            </Card>
          ))}

          <View style={local.trustStrip}>
            <ShieldCheck color={colors.greenDark} size={18} />
            <Text style={local.trustText}>Identité vérifiée, livrables visibles, paiement protégé.</Text>
            <TrendingUp color={colors.greenDark} size={18} />
          </View>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 20 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  brand: { fontSize: 30, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  subtitle: { fontSize: 14, color: colors.muted },
  alertButton: { width: 42, height: 42, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  eyebrow: { color: colors.yellow, fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  heroTitle: { fontSize: 31, lineHeight: 37, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  searchBox: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff" },
  input: { flex: 1, color: colors.ink },
  heroActions: { maxWidth: 220 },
  stats: { flexDirection: "row", gap: 10 },
  featureCard: { gap: space.md, padding: space.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line },
  featureTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  price: { fontWeight: "900", color: colors.ink },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  missionIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  trustStrip: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, padding: space.md, borderRadius: radii.md, backgroundColor: colors.mint },
  trustText: { flex: 1, color: colors.greenDark, fontWeight: "800", lineHeight: 19 }
});
