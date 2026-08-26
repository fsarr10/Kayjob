import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { missions } from "../../src/data";
import { colors } from "../../src/theme";

export default function MissionsScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Missions" action="Publier" />
        {missions.map((mission) => (
          <Card key={mission.id}>
            <View style={local.row}>
              <View style={local.main}>
                <Text style={local.title}>{mission.title}</Text>
                <Text style={shared.meta}>{mission.city} · {mission.mode} · {mission.offers} devis</Text>
              </View>
              <Text style={local.price}>{mission.budget}</Text>
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
  price: { fontWeight: "900", color: colors.ink }
});
