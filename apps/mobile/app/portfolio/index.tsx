import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { portfolio } from "../../src/data";
import { colors, radii } from "../../src/theme";

export default function PortfolioScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Portfolio public" action="kayjob.sn/awadesign" />
        <Card>
          <Text style={local.title}>Awa Diop</Text>
          <Text style={shared.meta}>Design · Kaolack · Identité vérifiée</Text>
          <View style={local.scorePill}><Text style={local.scoreText}>SamaScore 92/100</Text></View>
        </Card>
        {portfolio.map((work) => (
          <Card key={work.title}>
            <View style={local.preview}><Text style={local.previewText}>{work.type}</Text></View>
            <Text style={local.title}>{work.title}</Text>
            <Text style={shared.meta}>{work.detail}</Text>
            <PrimaryButton label="Voir la réalisation" />
          </Card>
        ))}
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  scorePill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff1b8" },
  scoreText: { color: "#674b00", fontWeight: "900" },
  preview: { height: 130, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.band },
  previewText: { color: colors.green, fontWeight: "900" }
});
