import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react-native";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, shadow, space } from "./theme";

type IconName = "search" | "briefcase" | "orders" | "messages" | "portfolio" | "account" | "admin" | "shield" | "spark" | "bell" | "pay";

const icons = {
  search: Search,
  briefcase: BriefcaseBusiness,
  orders: CheckCircle2,
  messages: MessageCircle,
  portfolio: FolderKanban,
  account: UserRound,
  admin: LayoutDashboard,
  shield: ShieldCheck,
  spark: Sparkles,
  bell: Bell,
  pay: CreditCard
};

function Icon({ name, color = colors.green, size = 18 }: { name: IconName; color?: string; size?: number }) {
  const Component = icons[name];
  return <Component color={color} size={size} strokeWidth={2.3} />;
}

export function Page({ children }: { children: ReactNode }) {
  return <View style={styles.page}>{children}</View>;
}

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function Card({ children, elevated = true }: { children: ReactNode; elevated?: boolean }) {
  return <View style={[styles.card, elevated ? shadow : null]}>{children}</View>;
}

export function AccentCard({ children, icon = "spark" }: { children: ReactNode; icon?: IconName }) {
  return (
    <LinearGradient colors={[colors.navy, colors.navySoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.accentCard, shadow]}>
      <View style={styles.accentIcon}><Icon name={icon} color="#fff" /></View>
      {children}
    </LinearGradient>
  );
}

export function Metric({ value, label, tone = "default" }: { value: string; label: string; tone?: "default" | "green" | "blue" }) {
  return (
    <View style={[styles.metric, tone === "green" ? styles.metricGreen : tone === "blue" ? styles.metricBlue : null]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, icon = "search" }: { label: string; icon?: IconName }) {
  return (
    <TouchableOpacity style={[styles.primary, shadow]} activeOpacity={0.86}>
      <Icon name={icon} color="#fff" />
      <Text style={styles.primaryText}>{label}</Text>
      <ArrowRight color="#fff" size={17} strokeWidth={2.4} />
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, icon = "spark" }: { label: string; icon?: IconName }) {
  return (
    <TouchableOpacity style={styles.secondary} activeOpacity={0.86}>
      <Icon name={icon} color={colors.greenDark} />
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ label, tone = "green" }: { label: string; tone?: "green" | "blue" | "amber" | "dark" }) {
  const toneStyle = {
    green: styles.badge_green,
    blue: styles.badge_blue,
    amber: styles.badge_amber,
    dark: styles.badge_dark
  }[tone];
  return <Text style={[styles.badge, toneStyle]}>{label}</Text>;
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const letters = name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return (
    <LinearGradient colors={[colors.green, colors.blue]} style={[styles.avatar, { width: size, height: size }]}>
      <Text style={styles.avatarText}>{letters}</Text>
    </LinearGradient>
  );
}

export function QuickNav() {
  const items: Array<{ href: string; label: string; icon: IconName }> = [
    { href: "/services", label: "Services", icon: "search" },
    { href: "/missions", label: "Missions", icon: "briefcase" },
    { href: "/orders", label: "Escrow", icon: "pay" },
    { href: "/messages", label: "Messages", icon: "messages" },
    { href: "/portfolio", label: "Portfolio", icon: "portfolio" },
    { href: "/account", label: "Compte", icon: "account" },
    { href: "/admin", label: "Admin", icon: "admin" }
  ];

  return (
    <View style={styles.quickNav}>
      {items.map((item) => (
        <Link key={item.href} href={item.href as never} asChild>
          <Pressable style={styles.quickLink}>
            <Icon name={item.icon} size={16} />
            <Text style={styles.quickText}>{item.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  page: { gap: space.lg, padding: space.lg, paddingBottom: 40 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sectionTitle: { flex: 1, fontSize: 22, fontWeight: "900", color: colors.ink, letterSpacing: 0 },
  sectionAction: { color: colors.green, fontWeight: "900" },
  card: { gap: space.sm, padding: space.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  accentCard: { gap: space.md, padding: space.lg, borderRadius: radii.lg, overflow: "hidden" },
  accentIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
  metric: { flex: 1, minHeight: 82, justifyContent: "space-between", padding: space.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  metricGreen: { backgroundColor: colors.mint, borderColor: "#bce6ce" },
  metricBlue: { backgroundColor: colors.blueSoft, borderColor: "#c9d9fb" },
  metricValue: { fontSize: 20, fontWeight: "900", color: colors.ink },
  meta: { color: colors.muted, lineHeight: 20 },
  primary: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radii.sm, backgroundColor: colors.green, paddingHorizontal: space.md },
  primaryText: { color: "#fff", fontWeight: "900", letterSpacing: 0 },
  secondary: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radii.sm, backgroundColor: colors.mint, borderWidth: 1, borderColor: "#bce6ce", paddingHorizontal: space.md },
  secondaryText: { color: colors.greenDark, fontWeight: "900" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.xs, overflow: "hidden", fontWeight: "900", fontSize: 12 },
  badge_green: { backgroundColor: colors.mint, color: colors.greenDark },
  badge_blue: { backgroundColor: colors.blueSoft, color: colors.blue },
  badge_amber: { backgroundColor: colors.amberSoft, color: "#725000" },
  badge_dark: { backgroundColor: colors.navy, color: "#fff" },
  avatar: { borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  quickNav: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickLink: { width: "31.7%", minHeight: 74, alignItems: "center", justifyContent: "center", gap: 8, padding: 8, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  quickText: { color: colors.ink, fontWeight: "900", fontSize: 12 }
});
