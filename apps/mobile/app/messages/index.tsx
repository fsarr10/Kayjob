import { Paperclip, Phone, Send, Video } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMemo, useState } from "react";
import { Avatar, Badge, Card, Page, Screen, SectionTitle, styles as shared } from "../../src/components";
import { messages, orders, services } from "../../src/data";
import { colors, radii, shadow, space } from "../../src/theme";

export default function MessagesScreen() {
  const service = services[1];
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState(messages);
  const quickReplies = ["D’accord", "J’envoie le brief", "C’est validé", "Merci"];
  const order = orders[0];

  const addMessage = (text: string, kind: "text" | "attachment" = "text") => {
    const value = text.trim();
    if (!value) return;
    setThread((current) => [
      ...current,
      {
        id: `msg-${Date.now()}`,
        from: "Client",
        text: kind === "attachment" ? `Pièce jointe : ${value}` : value,
        mine: true,
        time: "maintenant",
        status: "Vu",
        attachment: kind === "attachment"
      }
    ]);
    setDraft("");
  };

  const lastSeen = useMemo(() => thread[thread.length - 1]?.time || "10:42", [thread]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Messages" action="Commande" />

          <Card>
            <View style={local.orderHead}>
              <Avatar name={service.name} />
              <View style={local.main}>
                <Text style={local.title}>{order.id} · {order.title}</Text>
                <Text style={shared.meta}>{service.name} · paiement bloqué en escrow</Text>
              </View>
              <View style={local.contactActions}>
                <TouchableOpacity style={local.iconButton} activeOpacity={0.8} onPress={() => Alert.alert("Appel", "Appel vocal initié avec le prestataire.")}>
                  <Phone color={colors.green} size={17} />
                </TouchableOpacity>
                <TouchableOpacity style={local.iconButton} activeOpacity={0.8} onPress={() => Alert.alert("Vidéo", "Appel vidéo prêt à démarrer.")}>
                  <Video color={colors.green} size={17} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={local.badges}>
              <Badge label="En ligne" />
              <Badge label={`Dernier message · ${lastSeen}`} tone="blue" />
            </View>
          </Card>

          <Card style={local.chatCard}>
            <View style={local.chatHeader}>
              <View style={local.chatUser}>
                <Avatar name={service.name} size={34} />
                <View>
                  <Text style={local.chatName}>{service.name}</Text>
                  <Text style={local.chatStatus}>Répond généralement en quelques minutes</Text>
                </View>
              </View>
              <View style={local.onlineDot} />
            </View>

            <View style={local.messagesWrap}>
              {thread.map((message) => (
                <View key={message.id} style={[local.bubble, message.mine ? local.mine : local.theirs, shadow]}>
                  <Text style={[local.from, message.mine ? local.mineText : null]}>{message.from}</Text>
                  {message.attachment ? <View style={local.attachmentPill}><Text style={local.attachmentText}>📎 {message.text.replace("Pièce jointe : ", "")}</Text></View> : null}
                  {!message.attachment ? <Text style={[local.text, message.mine ? local.mineText : null]}>{message.text}</Text> : null}
                  <View style={local.metaRow}>
                    <Text style={[local.time, message.mine ? local.mineText : null]}>{message.time}</Text>
                    {message.mine ? <Text style={[local.statusText, message.mine ? local.mineText : null]}>{message.status || "Vu"}</Text> : null}
                  </View>
                </View>
              ))}
            </View>

            <View style={local.repliesRow}>
              {quickReplies.map((reply) => (
                <TouchableOpacity key={reply} activeOpacity={0.8} style={local.replyChip} onPress={() => addMessage(reply)}>
                  <Text style={local.replyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[local.composer, shadow]}>
              <TouchableOpacity style={local.iconButton} activeOpacity={0.8} onPress={() => {
                const attachmentName = "preuve-livraison.pdf";
                addMessage(attachmentName, "attachment");
              }}>
                <Paperclip color={colors.green} size={19} />
              </TouchableOpacity>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Écrivez un message..." placeholderTextColor="#7b8984" style={local.input} multiline />
              <TouchableOpacity style={local.sendButton} activeOpacity={0.8} onPress={() => addMessage(draft)}>
                <Send color="#fff" size={18} />
              </TouchableOpacity>
            </View>
          </Card>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const local = StyleSheet.create({
  orderHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactActions: { flexDirection: "row", gap: 8 },
  chatCard: { backgroundColor: colors.surface, padding: 0 },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  chatUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatName: { fontWeight: "900", color: colors.ink },
  chatStatus: { fontSize: 12, color: colors.muted },
  onlineDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.green },
  messagesWrap: { padding: space.md, gap: 12 },
  bubble: { gap: 6, maxWidth: "88%", padding: 12, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line },
  mine: { alignSelf: "flex-end", backgroundColor: colors.green, borderColor: colors.green },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surface },
  from: { fontWeight: "900", color: colors.ink, fontSize: 12 },
  text: { color: colors.ink, lineHeight: 20 },
  time: { fontSize: 11, color: colors.muted },
  mineText: { color: "#fff" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statusText: { fontSize: 11, color: colors.muted, fontWeight: "800" },
  attachmentPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" },
  attachmentText: { color: colors.ink, fontWeight: "800" },
  repliesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: space.md, paddingBottom: space.sm },
  replyChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.mint, borderWidth: 1, borderColor: "#bfe8d0" },
  replyText: { color: colors.greenDark, fontWeight: "800", fontSize: 12 },
  composer: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.sm, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, margin: space.md },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.mint },
  input: { flex: 1, color: colors.ink, maxHeight: 110 },
  sendButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.green }
});
