import { SlidersHorizontal } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Badge, Page, Screen, SearchField, SectionTitle, ServiceCard } from "../../src/components";
import { services } from "../../src/data";
import { colors, radii, space } from "../../src/theme";

export default function ServicesScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Talents" action="National" />
          <AccentCard icon="search">
            <Text style={local.heroTitle}>Trouve le bon talent sans bloquer par ville.</Text>
            <Text style={local.heroCopy}>Remote par défaut pour digital, design, média et dev. La proximité sert surtout aux services physiques.</Text>
            <View style={local.searchRow}>
              <View style={local.searchFlex}><SearchField placeholder="Compétence, budget ou ville" /></View>
              <View style={local.filterButton}><SlidersHorizontal color={colors.greenDark} size={20} /></View>
            </View>
          </AccentCard>

          <View style={local.filters}>
            <Badge label="À distance" />
            <Badge label="Sur place" tone="blue" />
            <Badge label="Budget max" tone="amber" />
            <Badge label="SamaScore" tone="dark" />
          </View>

          {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchFlex: { flex: 1 },
  filterButton: { width: 52, height: 52, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
