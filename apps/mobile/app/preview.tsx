import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Page, Screen, SectionTitle } from "../src/components";
import { SecurePreview } from "../src/SecurePreview";
import { colors } from "../src/theme";

export default function PreviewScreen() {
  return (
    <Screen>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Page>
          <SectionTitle title="Visionneuse" action="Privée" />
          <SecurePreview previewToken="preview_demo_token" watermark="KayJob · KJ-1024 · aperçu" onSecurityEvent={() => undefined} />
          <Text style={styles.note}>Le lecteur de production recevra uniquement un preview_token issu de l’API et demandera les chunks au serveur. Aucun lien de fichier public n’est utilisé.</Text>
        </Page>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.paper },
  note: { color: colors.muted, lineHeight: 20 }
});
