import { usePreventScreenCapture, useScreenshotListener } from "expo-screen-capture";
import { Eye, LockKeyhole, ShieldAlert } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, space } from "./theme";

type SecurePreviewProps = {
  previewToken: string;
  kind?: "image" | "video";
  watermark?: string;
  onSecurityEvent?: (event: "screenshot") => void;
};

/**
 * Presentation shell for the API preview stream. The API must resolve the token
 * to short-lived chunks; this component deliberately does not accept a public file URL.
 */
export function SecurePreview({ previewToken, kind = "image", watermark = "KayJob · aperçu privé", onSecurityEvent }: SecurePreviewProps) {
  usePreventScreenCapture("kayjob-preview");
  useScreenshotListener(() => onSecurityEvent?.("screenshot"));
  const hasSession = previewToken.trim().length > 0;

  return (
    <View style={styles.frame} accessibilityLabel={`${kind === "video" ? "Vidéo" : "Image"} protégée`}>
      <View style={styles.iconWrap}><LockKeyhole color={colors.yellow} size={26} /></View>
      <Text style={styles.title}>Aperçu sécurisé</Text>
      <Text style={styles.copy}>Lecture privée via KayJob. Le fichier source reste protégé.</Text>
      <View style={styles.streamRow}>
        <Eye color={colors.green} size={16} />
        <Text style={styles.streamText}>{hasSession ? "Session privée active" : "Session indisponible"}</Text>
      </View>
      <Text style={styles.watermark}>{watermark}</Text>
      {onSecurityEvent ? <View style={styles.notice}><ShieldAlert color={colors.coral} size={15} /><Text style={styles.noticeText}>Les captures sont signalées à KayJob.</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg, overflow: "hidden", borderRadius: radii.lg, backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.navySoft },
  iconWrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: "rgba(244,185,74,.16)" },
  title: { color: "#fff", fontSize: 18, fontWeight: "900" },
  copy: { maxWidth: 260, color: "#cbd8d2", lineHeight: 19, textAlign: "center" },
  streamRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.xs, backgroundColor: colors.mint },
  streamText: { color: colors.greenDark, fontSize: 12, fontWeight: "900" },
  watermark: { position: "absolute", right: 12, bottom: 10, color: "rgba(255,255,255,.42)", fontSize: 11, fontWeight: "800" },
  notice: { flexDirection: "row", alignItems: "center", gap: 5 },
  noticeText: { color: "#f5c0b5", fontSize: 11, fontWeight: "800" }
});
