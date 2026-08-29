import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Page, Screen, SectionTitle } from "../src/components";
import { SecurePreview } from "../src/SecurePreview";
import { colors } from "../src/theme";

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ previewToken?: string; orderId?: string }>();
  const previewToken = typeof params.previewToken === "string" ? params.previewToken : "";
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  return (
    <Screen>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Page>
          <SectionTitle title="Visionneuse" action="Privée" />
          {previewToken ? (
            <SecurePreview previewToken={previewToken} watermark={`KayJob · ${orderId || "commande"} · aperçu`} onSecurityEvent={() => undefined} />
          ) : (
            <Text style={styles.note}>Aucun aperçu sécurisé disponible. Ouvre une livraison depuis une commande synchronisée.</Text>
          )}
          <Text style={styles.note}>Le lecteur reçoit uniquement un preview_token issu de l’API et demande les chunks au serveur. Aucun lien de fichier public n’est utilisé.</Text>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.paper },
  note: { color: colors.muted, lineHeight: 20 }
});
