import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { messages, orders } from "../../src/data";
import { colors, radii } from "../../src/theme";

export default function MessagesScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Messages" action="Temps réel" />
        <Card>
          <Text style={local.title}>{orders[0].id} · {orders[0].title}</Text>
          <Text style={shared.meta}>Conversation liée à une commande avec paiement sécurisé.</Text>
        </Card>

        {messages.map((message) => (
          <View key={message.id} style={[local.bubble, message.mine ? local.mine : local.theirs]}>
            <Text style={[local.from, message.mine ? local.mineText : null]}>{message.from}</Text>
            <Text style={[local.text, message.mine ? local.mineText : null]}>{message.text}</Text>
          </View>
        ))}

        <View style={local.composer}>
          <TextInput placeholder="Écrire un message..." placeholderTextColor="#7b8984" style={local.input} />
          <PrimaryButton label="Envoyer" />
        </View>
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  bubble: { gap: 4, maxWidth: "88%", padding: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line },
  mine: { alignSelf: "flex-end", backgroundColor: colors.green },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surface },
  from: { fontWeight: "900", color: colors.ink },
  text: { color: colors.ink, lineHeight: 20 },
  mineText: { color: "#fff" },
  composer: { gap: 10 },
  input: { minHeight: 48, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, color: colors.ink }
});
