import { MessageCircle, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card, Page, Screen, SectionTitle, styles as shared } from "../../src/components";
import { api } from "../../src/api";
import { loadOrders, type LiveOrder } from "../../src/live-data";
import { colors, radii, shadow, space } from "../../src/theme";

type ApiMessage = {
  id: number;
  senderName?: string;
  body: string;
  createdAt: string;
  me: boolean;
};

export default function MessagesScreen() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [thread, setThread] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders().then((nextOrders) => {
      setOrders(nextOrders);
      setSelectedOrder(nextOrders[0] || null);
    }).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Commandes indisponibles"));
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    const orderId = Number(selectedOrder.id.replace(/\D+/g, ""));
    if (!orderId) return;
    api<ApiMessage[]>(`/api/orders/${orderId}/messages`).then(setThread).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Messages indisponibles"));
  }, [selectedOrder]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !selectedOrder) return;
    const orderId = Number(selectedOrder.id.replace(/\D+/g, ""));
    try {
      const saved = await api<ApiMessage>(`/api/orders/${orderId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
      setThread((current) => [...current, saved]);
      setDraft("");
    } catch (nextError) {
      Alert.alert("Message non envoyé", nextError instanceof Error ? nextError.message : "Réessaie plus tard");
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Messages" action="API" />
          {error ? <Text style={shared.meta}>{error}</Text> : null}

          {!orders.length ? <Card><Text style={local.title}>Aucune commande synchronisée</Text><Text style={shared.meta}>Les conversations apparaissent après une commande créée en base.</Text></Card> : null}

          {orders.map((order) => (
            <TouchableOpacity key={order.id} activeOpacity={0.86} onPress={() => setSelectedOrder(order)}>
              <Card elevated={selectedOrder?.id === order.id}>
                <View style={local.orderHead}>
                  <MessageCircle color={colors.green} size={20} />
                  <View style={local.main}>
                    <Text style={local.title}>{order.id}</Text>
                    <Text style={shared.meta}>{order.title}</Text>
                  </View>
                  <Badge label={order.status} tone="blue" />
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          {selectedOrder ? (
            <Card style={local.chatCard}>
              <Text style={local.title}>Conversation {selectedOrder.id}</Text>
              {thread.map((message) => (
                <View key={message.id} style={[local.bubble, message.me ? local.mine : local.theirs, shadow]}>
                  <Text style={[local.from, message.me ? local.mineText : null]}>{message.senderName || "KayJob"}</Text>
                  <Text style={[local.text, message.me ? local.mineText : null]}>{message.body}</Text>
                </View>
              ))}
              <View style={[local.composer, shadow]}>
                <TextInput value={draft} onChangeText={setDraft} placeholder="Écrire un message..." placeholderTextColor="#7b8984" style={local.input} multiline />
                <TouchableOpacity style={local.sendButton} activeOpacity={0.8} onPress={send}>
                  <Send color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            </Card>
          ) : null}
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  orderHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  chatCard: { backgroundColor: colors.surface },
  bubble: { gap: 6, maxWidth: "88%", padding: 12, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line },
  mine: { alignSelf: "flex-end", backgroundColor: colors.green, borderColor: colors.green },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surfaceSoft },
  from: { fontWeight: "900", color: colors.ink, fontSize: 12 },
  text: { color: colors.ink, lineHeight: 20 },
  mineText: { color: "#fff" },
  composer: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.sm, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginTop: space.md },
  input: { flex: 1, color: colors.ink, maxHeight: 110 },
  sendButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.green }
});
