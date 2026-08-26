import { SlidersHorizontal, Star } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AccentCard, Avatar, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { services } from "../../src/data";
import { colors, radii, space } from "../../src/theme";

export default function ServicesScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Services" action="National" />
          <AccentCard icon="search">
            <Text style={local.heroTitle}>Trouve le bon talent sans bloquer par ville.</Text>
            <Text style={local.heroCopy}>Remote par défaut pour digital, design, média et dev. La proximité sert surtout aux services physiques.</Text>
            <View style={local.search}>
              <TextInput placeholder="Compétence, budget, ville..." placeholderTextColor="#7b8984" style={local.input} />
              <SlidersHorizontal color={colors.green} size={20} />
            </View>
          </AccentCard>

          <View style={local.filters}>
            <Badge label="À distance" />
            <Badge label="Sur place" tone="blue" />
            <Badge label="Budget max" tone="amber" />
            <Badge label="SamaScore" tone="dark" />
          </View>

          {services.map((service) => (
            <Card key={service.id}>
              <View style={local.top}>
                <Avatar name={service.name} />
                <View style={local.main}>
                  <Text style={local.title}>{service.title}</Text>
                  <Text style={shared.meta}>{service.name} · {service.city} · {service.category}</Text>
                </View>
                <View style={local.scoreBox}>
                  <Star color={colors.yellow} fill={colors.yellow} size={15} />
                  <Text style={local.scoreText}>{service.rating}</Text>
                </View>
              </View>

              <View style={local.badges}>
                <Badge label={service.mode} />
                <Badge label={`SamaScore ${service.score}`} tone="amber" />
                <Badge label={service.work} tone="blue" />
              </View>

              <Text style={shared.meta}>{service.skills.join(" · ")}</Text>
              <View style={local.bottom}>
                <Text style={local.price}>{service.price}</Text>
                <View style={local.buttonWrap}>
                  <PrimaryButton label="Commander" icon="pay" />
                </View>
              </View>
            </Card>
          ))}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  search: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff" },
  input: { flex: 1, color: colors.ink },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  scoreBox: { minWidth: 52, minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radii.xs, backgroundColor: colors.amberSoft },
  scoreText: { color: "#725000", fontWeight: "900" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  price: { flex: 1, fontSize: 17, fontWeight: "900", color: colors.ink },
  buttonWrap: { width: 160 }
});
