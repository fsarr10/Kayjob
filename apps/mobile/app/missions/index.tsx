import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card, Page, PrimaryButton, SecondaryButton, SectionTitle, styles as shared } from "../../src/components";
import { missions } from "../../src/data";
import { colors } from "../../src/theme";

export default function MissionsScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Missions" action="Publier" />
        <Card>
          <Text style={local.title}>Publier un besoin</Text>
          <Text style={shared.meta}>Titre, budget, délai, ville si nécessaire et mode à distance ou sur place.</Text>
          <SecondaryButton label="Préparer la mission" />
        </Card>
        {missions.map((mission) => (
          <Card key={mission.id}>
            <View style={local.row}>
              <View style={local.main}>
                <Text style={local.title}>{mission.title}</Text>
                <Text style={shared.meta}>{mission.city} · {mission.mode} · {mission.offers} devis</Text>
              </View>
              <Text style={local.price}>{mission.budget}</Text>
            </View>
            <View style={local.badges}>
              <Badge label={mission.mode} />
              <Badge label={`${mission.offers} devis`} />
            </View>
            <PrimaryButton label="Faire un devis" />
          </Card>
        ))}
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  main: { flex: 1 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  price: { fontWeight: "900", color: colors.ink }
});
