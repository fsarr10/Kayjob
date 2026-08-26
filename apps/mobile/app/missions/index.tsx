import { CalendarClock, MapPin } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { AccentCard, Badge, Card, Page, PrimaryButton, Screen, SecondaryButton, SectionTitle, styles as shared } from "../../src/components";
import { missions as demoMissions } from "../../src/data";
import { loadMissions } from "../../src/live-data";
import { colors, radii, space } from "../../src/theme";

export default function MissionsScreen() {
  const [missions, setMissions] = useState(demoMissions);
  useEffect(() => { loadMissions().then(setMissions).catch(() => undefined); }, []);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Missions" action="Devis" />
          <AccentCard icon="briefcase">
            <Text style={local.heroTitle}>Publie un besoin, reçois des devis qualifiés.</Text>
            <Text style={local.heroCopy}>Budget, délai, ville si nécessaire, puis sélection du prestataire et paiement en escrow.</Text>
            <SecondaryButton label="Préparer la mission" icon="briefcase" />
          </AccentCard>

          {missions.map((mission) => (
            <Card key={mission.id}>
              <View style={local.top}>
                <View style={local.iconWrap}><MapPin color={colors.green} size={18} /></View>
                <View style={local.main}>
                  <Text style={local.title}>{mission.title}</Text>
                  <Text style={shared.meta}>{mission.city} · {mission.mode}</Text>
                </View>
                <Text style={local.price}>{mission.budget}</Text>
              </View>
              <View style={local.badges}>
                <Badge label={`${mission.offers} devis reçus`} tone="amber" />
                <Badge label="Ouverte" />
              </View>
              <View style={local.deadline}>
                <CalendarClock color={colors.muted} size={16} />
                <Text style={shared.meta}>Réponse recommandée aujourd'hui</Text>
              </View>
              <PrimaryButton label="Faire un devis" icon="briefcase" />
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
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  price: { fontWeight: "900", color: colors.ink },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deadline: { flexDirection: "row", alignItems: "center", gap: space.xs }
});
