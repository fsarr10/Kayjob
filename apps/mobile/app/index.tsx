import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";

const services = [
  { title: "Logo et identité visuelle", city: "Kaolack", mode: "À distance", price: "5 000 FCFA", score: 92, work: "3 réalisations" },
  { title: "Site vitrine React", city: "Dakar", mode: "À distance", price: "15 000 FCFA", score: 89, work: "Portfolio web" },
  { title: "Réparation PC", city: "Thiès", mode: "Sur place", price: "7 000 FCFA", score: 82, work: "Photos avant/après" }
];

const missions = [
  "Filmer une cérémonie à Kaolack",
  "Créer une affiche pour une conférence",
  "Corriger un mémoire de licence"
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />
      <KayJobLogo />
      <Text style={styles.brand}>KayJob</Text>
      <Text style={styles.subtitle}>Ton talent peut devenir ton premier revenu.</Text>

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statValue}>14</Text><Text style={styles.meta}>régions</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>10%</Text><Text style={styles.meta}>commission</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>Escrow</Text><Text style={styles.meta}>sécurisé</Text></View>
      </View>

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
          <Text style={styles.meta}>{service.work}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Missions ouvertes</Text>
      {missions.map((mission) => (
        <View key={mission} style={styles.card}>
          <Text style={styles.cardTitle}>{mission}</Text>
          <Text style={styles.meta}>Devis, messagerie et paiement bloqué à la commande.</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Commande sécurisée</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paiement → livraison → validation</Text>
        <Text style={styles.meta}>Le prestataire reçoit le net après validation client et commission configurable.</Text>
      </View>
    </ScrollView>
  );
}

function KayJobLogo() {
  return (
    <Svg width={72} height={72} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#16213D" />
          <Stop offset="100%" stopColor="#1B2A4A" />
        </LinearGradient>
        <LinearGradient id="rise" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E8862C" />
          <Stop offset="100%" stopColor="#F4B94A" />
        </LinearGradient>
      </Defs>
      <Rect width="200" height="200" rx="46" fill="url(#bg)" />
      <Circle cx="168" cy="34" r="70" fill="#F4B94A" opacity="0.08" />
      <Line x1="76" y1="52" x2="76" y2="148" stroke="#F7F4EE" strokeWidth="20" strokeLinecap="round" />
      <Line x1="76" y1="106" x2="132" y2="148" stroke="#F7F4EE" strokeWidth="20" strokeLinecap="round" />
      <Line x1="76" y1="106" x2="136" y2="50" stroke="url(#rise)" strokeWidth="20" strokeLinecap="round" />
      <Path d="M148 34 L152 44 L162 48 L152 52 L148 62 L144 52 L134 48 L144 44 Z" fill="#F4B94A" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fbfcfa" },
  content: { padding: 20, gap: 16 },
  brand: { fontSize: 42, fontWeight: "900", color: "#17211d" },
  subtitle: { fontSize: 18, color: "#607069" },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d9e0dc" },
  statValue: { fontSize: 18, fontWeight: "900", color: "#17211d" },
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
