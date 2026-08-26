import { CheckCircle2, CircleDollarSign, PackageCheck } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { AccentCard, Badge, Card, Page, PrimaryButton, Screen, SectionTitle, styles as shared } from "../../src/components";
import { loadOrders } from "../../src/live-data";
import { colors, radii, space } from "../../src/theme";

const steps = ["Paiement", "Travail", "Livraison", "Validation", "Reversement"];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof loadOrders>>>([]);
  useEffect(() => { loadOrders().then(setOrders).catch(() => undefined); }, []);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Commandes" action="Escrow" />
          <AccentCard icon="pay">
            <Text style={local.heroTitle}>Chaque paiement est protégé jusqu'à validation.</Text>
            <Text style={local.heroCopy}>Le client paie, KayJob bloque, le prestataire livre, puis le net est libéré.</Text>
          </AccentCard>

          <View style={local.flow}>
            {steps.map((step, index) => (
              <View key={step} style={[local.step, index < 3 ? local.stepActive : null]}>
                <Text style={[local.stepText, index < 3 ? local.stepTextActive : null]}>{step}</Text>
              </View>
            ))}
          </View>

          {orders.map((order) => (
            <Card key={order.id}>
              <View style={local.top}>
                <View style={local.iconWrap}>
                  {order.status === "Livré" ? <PackageCheck color={colors.blue} size={20} /> : <CircleDollarSign color={colors.green} size={20} />}
                </View>
                <View style={local.main}>
                  <Text style={local.title}>{order.id}</Text>
                  <Text style={shared.meta}>{order.title}</Text>
                </View>
                <Text style={local.amount}>{order.amount}</Text>
              </View>
              <View style={local.badges}>
                <Badge label={order.status} tone={order.status === "Livré" ? "blue" : "amber"} />
                <Badge label="Commission 10%" />
              </View>
              <View style={local.netRow}>
                <CheckCircle2 color={colors.green} size={17} />
                <Text style={local.netText}>Net prestataire : {order.net}</Text>
              </View>
            <PrimaryButton label={order.status === "Livré" ? "Valider et libérer" : "Ouvrir la commande"} icon="orders" onPress={() => router.push(order.status === "Livré" ? "/account" : "/messages")} />
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
  flow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  step: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: radii.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  stepActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  stepText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  stepTextActive: { color: "#fff" },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 46, height: 46, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  amount: { fontWeight: "900", color: colors.ink },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  netRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  netText: { color: colors.greenDark, fontWeight: "800" }
});
