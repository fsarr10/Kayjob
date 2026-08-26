import { Link } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii } from "./theme";

export function Page({ children }: { children: ReactNode }) {
  return <View style={styles.page}>{children}</View>;
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label }: { label: string }) {
  return (
    <TouchableOpacity style={styles.primary}>
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label }: { label: string }) {
  return (
    <TouchableOpacity style={styles.secondary}>
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}

export function QuickNav() {
  return (
    <View style={styles.quickNav}>
      <Link href="/services" style={styles.quickLink}>Services</Link>
      <Link href="/missions" style={styles.quickLink}>Missions</Link>
      <Link href="/orders" style={styles.quickLink}>Commandes</Link>
      <Link href="/messages" style={styles.quickLink}>Messages</Link>
      <Link href="/portfolio" style={styles.quickLink}>Portfolio</Link>
      <Link href="/account" style={styles.quickLink}>Compte</Link>
      <Link href="/admin" style={styles.quickLink}>Admin</Link>
    </View>
  );
}

export const styles = StyleSheet.create({
  page: { gap: 16, padding: 18, paddingBottom: 34 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: colors.ink },
  sectionAction: { color: colors.green, fontWeight: "900" },
  card: { gap: 10, padding: 16, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  metric: { flex: 1, padding: 12, borderRadius: radii.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  metricValue: { fontSize: 17, fontWeight: "900", color: colors.ink },
  meta: { color: colors.muted, lineHeight: 20 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: colors.green },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: "#e3f4ea", borderWidth: 1, borderColor: "#b9dec8" },
  secondaryText: { color: colors.greenDark, fontWeight: "900" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.sm, overflow: "hidden", backgroundColor: "#eef6f1", color: colors.greenDark, fontWeight: "900" },
  quickNav: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickLink: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.sm, overflow: "hidden", color: colors.green, backgroundColor: "#e3f4ea", fontWeight: "900" }
});
