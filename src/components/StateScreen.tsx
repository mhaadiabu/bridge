import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { colors } from "@/theme";

type StateScreenProps = {
  title: string;
  message?: string;
  loading?: boolean;
  tone?: "default" | "danger";
};

export function StateScreen({
  title,
  message,
  loading = false,
  tone = "default",
}: StateScreenProps) {
  return (
    <Screen scrollable={false}>
      <View style={styles.centered}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={styles.title}>{title}</Text>
        {message ? (
          <Text style={[styles.message, tone === "danger" && styles.messageDanger]}>{message}</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  messageDanger: {
    color: colors.danger,
  },
});
