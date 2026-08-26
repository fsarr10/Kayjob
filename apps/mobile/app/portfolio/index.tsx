import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { portfolio, services } from "../../src/data";
import { colors, radii } from "../../src/theme";

export default function PortfolioScreen() {
  const student = services[0];

  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Portfolio public" action={`kayjob.sn/${student.pseudo}`} />
        <Card>
          <Text style={local.title}>{student.name}</Text>
          <Text style={shared.meta}>{student.category} · {student.city} · Identité vérifiée</Text>
          <View style={local.badges}>
            <Badge label={`SamaScore ${student.score}/100`} />
            <Badge label={`${student.rating}/5`} />
            <Badge label={student.mode} />
          </View>
          <View style={local.scorePill}><Text style={local.scoreText}>SamaScore {student.score}/100</Text></View>
        </Card>
        {portfolio.map((work) => (
          <Card key={work.title}>
            <View style={[local.preview, work.type === "Lien" ? local.linkPreview : local.imagePreview]}>
              <Text style={local.previewText}>{work.type}</Text>
            </View>
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
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scorePill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff1b8" },
  scoreText: { color: "#674b00", fontWeight: "900" },
  preview: { height: 130, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.band },
  imagePreview: { backgroundColor: "#e8f1ec" },
  linkPreview: { backgroundColor: "#eaf0ff" },
  previewText: { color: colors.green, fontWeight: "900" }
});
