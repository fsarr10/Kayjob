import { ExternalLink } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { AccentCard, Avatar, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { loadMyPortfolio, loadServices, type LivePortfolio, type LiveService } from "../../src/live-data";
import { colors } from "../../src/theme";

export default function PortfolioScreen() {
  const [services, setServices] = useState<LiveService[]>([]);
  const [portfolio, setPortfolio] = useState<LivePortfolio | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([loadServices(), loadMyPortfolio()]).then(([nextServices, nextPortfolio]) => {
      setServices(nextPortfolio?.services.length ? nextPortfolio.services : nextServices);
      setPortfolio(nextPortfolio);
    }).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Chargement impossible"));
  }, []);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Portfolio public" action="Base de données" />
          <AccentCard icon="portfolio">
            <Text style={local.heroTitle}>Profils synchronisés KayJob.</Text>
            <Text style={local.heroCopy}>Les services affichés ici viennent uniquement du backend connecté à Neon.</Text>
          </AccentCard>

          {error ? <Text style={shared.meta}>{error}</Text> : null}
          {!error && !services.length ? <Text style={shared.meta}>Aucun service publié pour le moment.</Text> : null}

          {services.map((service) => (
            <Card key={service.id}>
              <View style={local.profileTop}>
                <Avatar name={service.name} />
                <View style={local.main}>
                  <Text style={local.title}>{service.title}</Text>
                  <Text style={shared.meta}>{service.name} · {service.city} · {service.category}</Text>
                </View>
                <ExternalLink color={colors.green} size={19} />
              </View>
              <View style={local.badges}>
                <Badge label={service.mode} />
                <Badge label={`SamaScore ${service.score}/100`} tone="amber" />
              </View>
              <PrimaryButton label="Contacter via commande" icon="portfolio" onPress={() => Alert.alert("Commande requise", "Ouvre une commande synchronisée pour contacter ce talent.")} />
            </Card>
          ))}
          {portfolio ? (
            <Card>
              <Text style={local.title}>{portfolio.headline}</Text>
              {portfolio.bio ? <Text style={shared.meta}>{portfolio.bio}</Text> : null}
              <View style={local.badges}>
                <Badge label={`@${portfolio.pseudo}`} />
                <Badge label={portfolio.city} tone="amber" />
              </View>
              {portfolio.items.length ? portfolio.items.map((item) => (
                <View key={item.id} style={local.item}>
                  <Text style={local.itemTitle}>{item.title}</Text>
                  <Text style={shared.meta}>{item.description || item.type}</Text>
                </View>
              )) : <Text style={shared.meta}>Aucune réalisation publiée pour le moment.</Text>}
            </Card>
          ) : null}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: "#fff", letterSpacing: 0 },
  heroCopy: { color: "#dfe8e4", lineHeight: 21 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  item: { borderTopWidth: 1, borderTopColor: "#e2ebe7", paddingTop: 12, gap: 4 },
  itemTitle: { fontWeight: "900", color: colors.ink },
  title: { fontSize: 18, fontWeight: "900", color: colors.ink, letterSpacing: 0 }
});
