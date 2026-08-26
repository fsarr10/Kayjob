import { Activity, ShieldAlert } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Badge, Card, Metric, Page, Screen, SectionTitle, styles as shared } from "../../src/components";
import { adminStats, cities, verificationQueue } from "../../src/data";
import { colors, radii, space } from "../../src/theme";

export default function AdminScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Admin" action="National" />
          <AccentCard icon="admin">
            <Text style={local.heroTitle}>Pilotage national KayJob.</Text>
            <Text style={local.heroCopy}>Vérifications, escrow, litiges et performance par région depuis un seul espace.</Text>
          </AccentCard>

          <View style={local.stats}>
            {adminStats.map((stat, index) => (
              <Metric key={stat.label} value={stat.value} label={stat.label} tone={index === 0 ? "green" : index === 2 ? "blue" : "default"} />
            ))}
          </View>

          <Card>
            <View style={local.panelHead}>
              <ShieldAlert color={colors.coral} size={21} />
              <Text style={local.title}>Vérifications à traiter</Text>
            </View>
            {verificationQueue.map((item) => (
              <View key={item} style={local.queueItem}>
                <Text style={local.dot}>•</Text>
                <Text style={shared.meta}>{item}</Text>
              </View>
            ))}
          </Card>

          <Card>
            <View style={local.panelHead}>
              <Activity color={colors.green} size={21} />
              <Text style={local.title}>Couverture Sénégal</Text>
            </View>
            <View style={local.badges}>
              {cities.map((city) => <Badge key={city} label={city} tone="blue" />)}
            </View>
          </Card>

          <Card>
            <Text style={local.title}>Règles critiques</Text>
            <Text style={shared.meta}>Documents privés, badge public, escrow, litiges modérés et commissions configurables.</Text>
          </Card>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  stats: { flexDirection: "row", gap: 10 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  queueItem: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, borderRadius: radii.xs, backgroundColor: colors.surfaceSoft },
  dot: { color: colors.green, fontWeight: "900" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 }
});
