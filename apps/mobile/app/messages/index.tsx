import { Paperclip, Send } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { Avatar, Badge, Card, Page, Screen, SectionTitle, styles as shared } from "../../src/components";
import { messages, orders, services } from "../../src/data";
import { colors, radii, shadow, space } from "../../src/theme";

export default function MessagesScreen() {
  const service = services[1];
  const [draft, setDraft] = useState("");

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Page>
          <SectionTitle title="Messages" action="Commande" />
          <Card>
            <View style={local.orderHead}>
              <Avatar name={service.name} />
              <View style={local.main}>
                <Text style={local.title}>{orders[0].id} · {orders[0].title}</Text>
                <Text style={shared.meta}>{service.name} · paiement bloqué en escrow</Text>
              </View>
            </View>
            <View style={local.badges}>
              <Badge label="Livrables autorisés" />
              <Badge label="Preuves conservées" tone="blue" />
            </View>
          </Card>

          {messages.map((message) => (
            <View key={message.id} style={[local.bubble, message.mine ? local.mine : local.theirs, shadow]}>
              <Text style={[local.from, message.mine ? local.mineText : null]}>{message.from}</Text>
              <Text style={[local.text, message.mine ? local.mineText : null]}>{message.text}</Text>
            </View>
          ))}

          <View style={[local.composer, shadow]}>
            <TouchableOpacity style={local.iconButton} activeOpacity={0.8} onPress={() => Alert.alert("Pièce jointe", "Les fichiers seront envoyés dans l’espace de commande sécurisé.")}>
              <Paperclip color={colors.green} size={19} />
            </TouchableOpacity>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Message ou lien de livraison..." placeholderTextColor="#7b8984" style={local.input} />
            <TouchableOpacity style={local.sendButton} activeOpacity={0.8} onPress={() => { if (!draft.trim()) return; Alert.alert("Message prêt", "Connecte-toi pour envoyer ce message dans la commande."); setDraft(""); }}>
              <Send color="#fff" size={18} />
            </TouchableOpacity>
          </View>
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
  bubble: { gap: 5, maxWidth: "88%", padding: 15, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line },
  mine: { alignSelf: "flex-end", backgroundColor: colors.green, borderColor: colors.green },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surface },
  from: { fontWeight: "900", color: colors.ink },
  text: { color: colors.ink, lineHeight: 20 },
  mineText: { color: "#fff" },
  composer: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.sm, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.mint },
  input: { flex: 1, color: colors.ink },
  sendButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.green }
});
