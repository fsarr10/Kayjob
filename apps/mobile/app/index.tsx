import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const services = [
  { title: "Logo et identité visuelle", city: "Kaolack", mode: "À distance", price: "5 000 FCFA", score: 92 },
  { title: "Site vitrine React", city: "Dakar", mode: "À distance", price: "15 000 FCFA", score: 89 },
  { title: "Réparation PC", city: "Thiès", mode: "Sur place", price: "7 000 FCFA", score: 82 }
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />
      <View style={styles.logo}><Text style={styles.logoText}>K</Text></View>
      <Text style={styles.brand}>KayJob</Text>
      <Text style={styles.subtitle}>Ton talent peut devenir ton premier revenu.</Text>
      <View style={styles.searchBox}>
        <TextInput placeholder="Compétence, ville, budget..." style={styles.input} />
        <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Rechercher</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Services recommandés</Text>
      {services.map((service) => (
        <View key={service.title} style={styles.card}>
          <Text style={styles.cardTitle}>{service.title}</Text>
          <Text style={styles.meta}>{service.city} · {service.mode}</Text>
          <View style={styles.row}><Text style={styles.price}>{service.price}</Text><Text style={styles.score}>SamaScore {service.score}/100</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fbfcfa" },
  content: { padding: 20, gap: 16 },
  logo: { width: 72, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#16213D" },
  logoText: { color: "#F4B94A", fontSize: 34, fontWeight: "900" },
  brand: { fontSize: 42, fontWeight: "900", color: "#17211d" },
  subtitle: { fontSize: 18, color: "#607069" },
  searchBox: { gap: 10, padding: 14, borderRadius: 8, backgroundColor: "#eef4ef" },
  input: { minHeight: 46, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#fff" },
  button: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#137a4b" },
  buttonText: { color: "#fff", fontWeight: "800" },
  sectionTitle: { marginTop: 10, fontSize: 22, fontWeight: "800", color: "#17211d" },
  card: { gap: 8, padding: 16, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d9e0dc" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#17211d" },
  meta: { color: "#607069", lineHeight: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  price: { fontWeight: "900", color: "#17211d" },
  score: { color: "#0d5737", fontWeight: "800" }
});
