import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Metric, Page, SectionTitle, styles as shared } from "../../src/components";
import { adminStats, cities, verificationQueue } from "../../src/data";
import { colors } from "../../src/theme";

export default function AdminScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Admin" action="National" />
        <View style={local.stats}>
          {adminStats.map((stat) => <Metric key={stat.label} value={stat.value} label={stat.label} />)}
        </View>

        <Card>
          <Text style={local.title}>Vérifications à traiter</Text>
          {verificationQueue.map((item) => <Text key={item} style={shared.meta}>• {item}</Text>)}
        </Card>

        <Card>
          <Text style={local.title}>Couverture Sénégal</Text>
          <Text style={shared.meta}>{cities.join(" · ")}</Text>
        </Card>

        <Card>
          <Text style={local.title}>Règles critiques</Text>
          <Text style={shared.meta}>Documents privés, badge public, escrow, litiges modérés et commissions configurables.</Text>
        </Card>
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  stats: { flexDirection: "row", gap: 10 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink }
});
