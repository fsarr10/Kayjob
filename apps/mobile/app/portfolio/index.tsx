import { ExternalLink, Image as ImageIcon, Link2 } from "lucide-react-native";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Avatar, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { portfolio, services } from "../../src/data";
import { colors, radii, space } from "../../src/theme";

export default function PortfolioScreen() {
  const student = services[0];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Portfolio public" action={`kayjob.sn/${student.pseudo}`} />
          <AccentCard icon="portfolio">
            <View style={local.profileTop}>
              <Avatar name={student.name} size={62} />
              <View style={local.main}>
                <Text style={local.heroTitle}>{student.name}</Text>
                <Text style={local.heroCopy}>{student.category} · {student.city} · {student.mode}</Text>
              </View>
            </View>
            <View style={local.badges}>
              <Badge label="Identité vérifiée" tone="dark" />
              <Badge label={`SamaScore ${student.score}/100`} tone="amber" />
              <Badge label={`${student.rating}/5`} />
            </View>
          </AccentCard>

          <SectionTitle title="Réalisations" action="Image + lien" />
          {portfolio.map((work) => (
            <Card key={work.title}>
              <View style={[local.preview, work.type === "Lien" ? local.linkPreview : local.imagePreview]}>
                {work.type === "Lien" ? <Link2 color={colors.blue} size={26} /> : <ImageIcon color={colors.green} size={26} />}
                <Text style={local.previewText}>{work.type}</Text>
              </View>
              <View style={local.workHead}>
                <View style={local.main}>
                  <Text style={local.title}>{work.title}</Text>
                  <Text style={shared.meta}>{work.detail}</Text>
                </View>
                <ExternalLink color={colors.green} size={19} />
              </View>
              <PrimaryButton label="Voir la réalisation" icon="portfolio" onPress={() => work.type === "Lien" ? Linking.openURL("https://github.com/") : Alert.alert("Réalisation", work.detail)} />
            </Card>
          ))}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 25, lineHeight: 31, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 20 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preview: { height: 146, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", gap: space.sm },
  imagePreview: { backgroundColor: colors.mint },
  linkPreview: { backgroundColor: colors.blueSoft },
  previewText: { color: colors.ink, fontWeight: "900" },
  workHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 18, fontWeight: "900", color: colors.ink, letterSpacing: 0 }
});
