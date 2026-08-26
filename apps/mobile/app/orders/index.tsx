import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { orders } from "../../src/data";
import { colors } from "../../src/theme";

export default function OrdersScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Commandes" action="Escrow" />
        <View style={local.flow}>
          {["Paiement", "Travail", "Livraison", "Validation", "Reversement"].map((step) => (
            <View key={step} style={local.step}><Text style={local.stepText}>{step}</Text></View>
          ))}
        </View>
        {orders.map((order) => (
          <Card key={order.id}>
            <View style={local.row}>
              <View style={local.main}>
                <Text style={local.title}>{order.id}</Text>
                <Text style={shared.meta}>{order.title} · {order.status}</Text>
              </View>
              <Text style={local.price}>{order.amount}</Text>
            </View>
            <View style={local.badges}>
              <Badge label={order.status} />
              <Badge label="Commission 10%" />
            </View>
            <Text style={shared.meta}>Net prestataire : {order.net}</Text>
            <PrimaryButton label={order.status === "Livré" ? "Valider et libérer" : "Ouvrir la commande"} />
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
  flow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  step: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  stepText: { color: colors.ink, fontWeight: "800" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  price: { fontWeight: "900", color: colors.ink }
});
