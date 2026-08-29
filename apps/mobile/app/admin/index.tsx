import { Activity, ShieldAlert } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Card, Metric, Page, Screen, SectionTitle, styles as shared } from "../../src/components";
import { api } from "../../src/api";
import { colors, space } from "../../src/theme";

type AdminOverview = {
  users: number;
  orders: Array<{ status: string; count: number }>;
  openDisputes: number;
  heldVolumeXof: number;
};

export default function AdminScreen() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AdminOverview>("/api/admin/overview").then(setOverview).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Accès admin impossible"));
  }, []);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Admin" action="API" />
          <AccentCard icon="admin">
            <Text style={local.heroTitle}>Pilotage national KayJob.</Text>
            <Text style={local.heroCopy}>Cet écran lit uniquement les métriques renvoyées par le backend connecté à Neon.</Text>
          </AccentCard>

          {error ? <Card><View style={local.panelHead}><ShieldAlert color={colors.coral} size={21} /><Text style={local.title}>Accès indisponible</Text></View><Text style={shared.meta}>{error}</Text></Card> : null}

          {overview ? (
            <>
              <View style={local.stats}>
                <Metric value={String(overview.users)} label="utilisateurs" tone="green" />
                <Metric value={String(overview.openDisputes)} label="litiges ouverts" />
                <Metric value={`${Number(overview.heldVolumeXof).toLocaleString("fr-FR")} FCFA`} label="volume bloqué" tone="blue" />
              </View>
              <Card>
                <View style={local.panelHead}>
                  <Activity color={colors.green} size={21} />
                  <Text style={local.title}>Commandes par statut</Text>
                </View>
                {overview.orders.map((item) => <Text key={item.status} style={shared.meta}>{item.status} · {item.count}</Text>)}
              </Card>
            </>
          ) : null}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  stats: { flexDirection: "row", gap: 10 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink }
});
