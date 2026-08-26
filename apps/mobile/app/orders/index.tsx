import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { orders } from "../../src/data";
import { colors } from "../../src/theme";

export default function OrdersScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Commandes" action="Escrow" />
        {orders.map((order) => (
          <Card key={order.id}>
            <View style={local.row}>
              <View style={local.main}>
                <Text style={local.title}>{order.id}</Text>
                <Text style={shared.meta}>{order.title} · {order.status}</Text>
              </View>
              <Text style={local.price}>{order.amount}</Text>
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
  price: { fontWeight: "900", color: colors.ink }
});
