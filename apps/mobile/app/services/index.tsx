import { SlidersHorizontal } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Badge, Page, Screen, SearchField, SectionTitle, ServiceCard } from "../../src/components";
import { loadServices } from "../../src/live-data";
import { colors, radii, space } from "../../src/theme";

export default function ServicesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState("Tous");
  const [services, setServices] = useState<Awaited<ReturnType<typeof loadServices>>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadServices().then(setServices).catch(() => undefined).finally(() => setLoading(false)); }, []);
  const modes = ["Tous", "À distance", "Sur place", "Les deux"];
  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesMode = selectedMode === "Tous" || service.mode === selectedMode;
      const searchable = `${service.title} ${service.name} ${service.category} ${service.city} ${service.skills.join(" ")}`.toLowerCase();
      return matchesMode && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, selectedMode]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Talents" action="National" />
          <AccentCard icon="search">
            <Text style={local.heroTitle}>Trouve le bon talent sans bloquer par ville.</Text>
            <Text style={local.heroCopy}>Remote par défaut pour digital, design, média et dev. La proximité sert surtout aux services physiques.</Text>
            <View style={local.searchRow}>
              <View style={local.searchFlex}><SearchField value={query} onChangeText={setQuery} placeholder="Compétence, budget ou ville" /></View>
              <View style={local.filterButton}><SlidersHorizontal color={colors.greenDark} size={20} /></View>
            </View>
          </AccentCard>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.filters}>
            {modes.map((mode) => (
              <Pressable key={mode} onPress={() => setSelectedMode(mode)} style={[local.filterChip, selectedMode === mode ? local.filterChipActive : null]}>
                <Text style={[local.filterText, selectedMode === mode ? local.filterTextActive : null]}>{mode}</Text>
              </Pressable>
            ))}
            <View style={local.staticChip}><Badge label="SamaScore" tone="amber" /></View>
          </ScrollView>

          <View style={local.resultHead}>
            <Text style={local.resultCount}>{loading ? "Chargement..." : `${filteredServices.length} talent${filteredServices.length > 1 ? "s" : ""}`}</Text>
            <Text style={local.resultHint}>Pertinence d'abord</Text>
          </View>

          {filteredServices.length > 0 ? filteredServices.map((service) => <ServiceCard key={service.id} service={service} onPress={() => router.push("/portfolio")} />) : (
            <View style={local.emptyState}>
              <Text style={local.emptyTitle}>Aucun talent trouvé</Text>
              <Text style={local.emptyCopy}>Essaie une autre compétence ou retire le filtre de localisation.</Text>
              <Pressable onPress={() => { setQuery(""); setSelectedMode("Tous"); }} style={local.resetButton}>
                <Text style={local.resetText}>Réinitialiser la recherche</Text>
              </Pressable>
            </View>
          )}
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
  filters: { gap: 8, paddingRight: 18 },
  filterChip: { minHeight: 38, justifyContent: "center", paddingHorizontal: 14, borderRadius: radii.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.inkSoft, fontWeight: "900", fontSize: 12 },
  filterTextActive: { color: "#fff" },
  staticChip: { justifyContent: "center" },
  resultHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultCount: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  resultHint: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  emptyState: { alignItems: "center", gap: 10, padding: 28, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  emptyCopy: { color: colors.muted, lineHeight: 20, textAlign: "center" },
  resetButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: radii.sm, backgroundColor: colors.mint },
  resetText: { color: colors.greenDark, fontWeight: "900" },
});
