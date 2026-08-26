import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";

const services = [
  { title: "Logo et identité visuelle", city: "Kaolack", mode: "À distance", price: "5 000 FCFA", score: 92, work: "3 réalisations" },
  { title: "Site vitrine React", city: "Dakar", mode: "À distance", price: "15 000 FCFA", score: 89, work: "Portfolio web" },
  { title: "Réparation PC", city: "Thiès", mode: "Sur place", price: "7 000 FCFA", score: 82, work: "Photos avant/après" }
];

const missions = [
  { title: "Filmer une cérémonie", city: "Kaolack", price: "18 000 FCFA" },
  { title: "Créer une affiche", city: "Touba", price: "6 000 FCFA" },
  { title: "Corriger un mémoire", city: "Dakar", price: "10 000 FCFA" }
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <KayJobLogo />
        <View style={styles.headerText}>
          <Text style={styles.brand}>KayJob</Text>
          <Text style={styles.subtitle}>Talents étudiants au Sénégal</Text>
        </View>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.heroTitle}>Ton talent peut devenir ton premier revenu.</Text>
        <Text style={styles.heroCopy}>Services, missions, portfolio public et paiement sécurisé.</Text>
        <View style={styles.searchBox}>
          <TextInput placeholder="Compétence, ville, budget..." placeholderTextColor="#7b8984" style={styles.input} />
          <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Rechercher</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.stats}>
        <Metric value="14" label="régions" />
        <Metric value="10%" label="commission" />
        <Metric value="Escrow" label="sécurisé" />
      </View>

      <SectionTitle title="Services recommandés" action="Tout voir" />
      {services.map((service) => (
        <View key={service.title} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{service.title[0]}</Text></View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.meta}>{service.city} · {service.mode}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.price}>{service.price}</Text>
            <Text style={styles.score}>SamaScore {service.score}/100</Text>
          </View>
          <Text style={styles.meta}>{service.work}</Text>
        </View>
      ))}

      <SectionTitle title="Missions ouvertes" action="Publier" />
      {missions.map((mission) => (
        <View key={mission.title} style={styles.missionCard}>
          <View>
            <Text style={styles.cardTitle}>{mission.title}</Text>
            <Text style={styles.meta}>{mission.city} · devis ouverts</Text>
          </View>
          <Text style={styles.price}>{mission.price}</Text>
        </View>
      ))}

      <View style={styles.escrowPanel}>
        <Text style={styles.cardTitle}>Commande sécurisée</Text>
        <Text style={styles.meta}>Paiement bloqué, livraison suivie, validation client, puis reversement net.</Text>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

function KayJobLogo() {
  return (
    <Svg width={54} height={54} viewBox="0 0 200 200">
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
  screen: { flex: 1, backgroundColor: "#f7faf8" },
  content: { padding: 18, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 22 },
  headerText: { flex: 1 },
  brand: { fontSize: 30, fontWeight: "900", color: "#151b19" },
  subtitle: { fontSize: 14, color: "#66746f" },
  heroPanel: { gap: 14, padding: 18, borderRadius: 12, backgroundColor: "#16213D" },
  heroTitle: { fontSize: 28, lineHeight: 33, fontWeight: "900", color: "#fff" },
  heroCopy: { color: "#d9e0dc", lineHeight: 20 },
  searchBox: { gap: 10 },
  input: { minHeight: 48, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#fff", color: "#151b19" },
  button: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#137a4b" },
  buttonText: { color: "#fff", fontWeight: "900" },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde5e1" },
  statValue: { fontSize: 17, fontWeight: "900", color: "#151b19" },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: "#151b19" },
  sectionAction: { color: "#137a4b", fontWeight: "900" },
  card: { gap: 10, padding: 16, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde5e1" },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#e3f4ea" },
  avatarText: { color: "#137a4b", fontWeight: "900" },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#151b19" },
  meta: { color: "#66746f", lineHeight: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  price: { fontWeight: "900", color: "#151b19" },
  score: { color: "#0d5737", fontWeight: "900" },
  missionCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde5e1" },
  escrowPanel: { gap: 8, padding: 16, borderRadius: 10, backgroundColor: "#edf4ef", borderWidth: 1, borderColor: "#d3dfd9" }
});
