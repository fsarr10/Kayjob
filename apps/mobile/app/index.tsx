import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Bell, MapPin, ShieldCheck, Sparkles, TrendingUp } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { AccentCard, Card, Metric, Page, PrimaryButton, Screen, SearchField, SectionTitle, ServiceCard, styles as shared } from "../src/components";
import { loadMissions, loadOrders, loadServices } from "../src/live-data";
import { KayJobLogo } from "../src/Logo";
import { colors, radii, shadow, space } from "../src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Awaited<ReturnType<typeof loadServices>>>([]);
  const [missions, setMissions] = useState<Awaited<ReturnType<typeof loadMissions>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof loadOrders>>>([]);
  useEffect(() => { Promise.all([loadServices(), loadMissions(), loadOrders()]).then(([nextServices, nextMissions, nextOrders]) => { setServices(nextServices); setMissions(nextMissions); setOrders(nextOrders); }).catch(() => undefined); }, []);
  const topService = services[0];

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
                <Text style={local.subtitle}>Talents & services au Sénégal</Text>
              </View>
            </View>
            <View style={local.headerActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Se connecter" onPress={() => router.push("/login")} style={local.loginButton}><Text style={local.loginText}>Se connecter</Text></Pressable>
              <View style={local.alertButton}><Bell color={colors.ink} size={19} /></View>
            </View>
          </View>

          <AccentCard icon="spark">
            <Text style={local.eyebrow}>Marketplace nationale</Text>
            <Text style={local.heroTitle}>Ton talent peut devenir ton premier revenu.</Text>
            <Text style={local.heroCopy}>Des compétences vérifiées, partout au Sénégal. Trouve, commande et avance en toute confiance.</Text>
            <SearchField placeholder="Que veux-tu faire aujourd'hui ?" />
            <View style={local.heroActions}>
              <PrimaryButton label="Explorer les talents" icon="search" onPress={() => router.push("/services")} />
            </View>
          </AccentCard>

          <View style={local.stats}>
            <Metric value="14" label="régions" tone="green" />
            <Metric value={String(services.length)} label="talents" />
            <Metric value={String(orders.length)} label="escrow" tone="blue" />
          </View>

          <SectionTitle title="Talent en avant" action="Voir tout" />
          {topService ? <ServiceCard service={topService} onPress={() => router.push("/portfolio")} /> : <Text style={shared.meta}>Aucun talent disponible pour le moment.</Text>}

          <View style={local.modeRow}>
            <View style={local.modeCard}>
              <Sparkles color={colors.green} size={20} />
              <Text style={local.modeTitle}>Je cherche un talent</Text>
              <Text style={shared.meta}>Des profils fiables pour chaque besoin.</Text>
            </View>
            <View style={[local.modeCard, local.modeCardBlue]}>
              <TrendingUp color={colors.blue} size={20} />
              <Text style={local.modeTitle}>Je propose mon talent</Text>
              <Text style={shared.meta}>Transforme tes compétences en missions.</Text>
            </View>
          </View>

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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  loginButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: colors.navy },
  loginText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  eyebrow: { color: colors.yellow, fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  heroTitle: { fontSize: 31, lineHeight: 37, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  heroActions: { maxWidth: 230 },
  stats: { flexDirection: "row", gap: 10 },
  featureMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  price: { fontWeight: "900", color: colors.ink },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  missionIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  trustStrip: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, padding: space.md, borderRadius: radii.md, backgroundColor: colors.mint },
  trustText: { flex: 1, color: colors.greenDark, fontWeight: "800", lineHeight: 19 },
  modeRow: { flexDirection: "row", gap: 10 },
  modeCard: { flex: 1, minHeight: 138, gap: 8, padding: space.md, borderRadius: radii.md, backgroundColor: colors.mint, borderWidth: 1, borderColor: "#bce6ce" },
  modeCardBlue: { backgroundColor: colors.blueSoft, borderColor: "#c9d9fb" },
  modeTitle: { fontSize: 15, lineHeight: 19, fontWeight: "900", color: colors.ink }
});
