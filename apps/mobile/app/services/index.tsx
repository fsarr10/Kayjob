import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Page, PrimaryButton, SectionTitle, styles as shared } from "../../src/components";
import { services } from "../../src/data";
import { colors, radii } from "../../src/theme";

export default function ServicesScreen() {
  return (
    <ScrollView style={local.screen}>
      <Page>
        <SectionTitle title="Services" action="National" />
        <TextInput placeholder="Rechercher par compétence" placeholderTextColor="#7b8984" style={local.input} />
        {services.map((service) => (
          <Card key={service.id}>
            <View style={local.row}>
              <View style={local.avatar}><Text style={local.avatarText}>{service.name[0]}</Text></View>
              <View style={local.main}>
                <Text style={local.title}>{service.title}</Text>
                <Text style={shared.meta}>{service.name} · {service.city} · {service.category}</Text>
              </View>
            </View>
            <View style={local.row}><Text style={local.price}>{service.price}</Text><Text style={local.score}>{service.score}/100</Text></View>
            <Text style={shared.meta}>{service.mode} · {service.work}</Text>
            <PrimaryButton label="Commander" />
          </Card>
        ))}
      </Page>
    </ScrollView>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  input: { minHeight: 48, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, color: colors.ink },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: "#e3f4ea" },
  avatarText: { color: colors.green, fontWeight: "900" },
  main: { flex: 1 },
  title: { fontSize: 17, fontWeight: "900", color: colors.ink },
  price: { fontWeight: "900", color: colors.ink },
  score: { color: colors.greenDark, fontWeight: "900" }
});
