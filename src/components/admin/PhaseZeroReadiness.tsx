import { StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { colors } from "@/theme";

type Props = { data: any };

export function PhaseZeroReadiness({ data }: Props) {
  if (!data) return null;
  const checks = [
    ["Assignment source system", data.openQuestions.assignmentSourceSystem],
    ["Submission source system", data.openQuestions.submissionSourceSystem],
    ["Access method", data.openQuestions.accessMethod],
    ["Minimum reliable fields", data.openQuestions.minimumReliableFields],
    ["Experiment setup requirements", data.openQuestions.experimentSetupRequirements],
  ] as const;

  return (
    <Panel>
      <Text style={styles.title}>Phase 0 readiness</Text>
      <Text style={styles.muted}>Assignment source: {data.assignmentSource ? `${data.assignmentSource.systemName} (${data.assignmentSource.accessMethod})` : "Not configured"}</Text>
      <Text style={styles.muted}>Submission source: {data.submissionSource ? `${data.submissionSource.systemName} (${data.submissionSource.accessMethod})` : "Not configured"}</Text>
      {checks.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.text}>{label}</Text>
          <Text style={[styles.badge, value ? styles.ok : styles.warn]}>{value ? "Done" : "Open"}</Text>
        </View>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  text: { color: colors.text, fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden", color: colors.text, fontSize: 12 },
  ok: { backgroundColor: "#14532d" },
  warn: { backgroundColor: "#713f12" },
});
