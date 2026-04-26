import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { colors } from "@/theme";

type Props = { onSeedDemo: () => void; onSetSourceConfig: (payload: { sourceType: "assignment" | "submission"; systemName: string; accessMethod: "api" | "database" | "import"; minReliableFields: string[]; status: "pending" | "confirmed"; notes?: string }) => void };

export function DataTools({ onSeedDemo, onSetSourceConfig }: Props) {
  const [assignmentSystemName, setAssignmentSystemName] = useState("UPSA LMS Pilot Feed");
  const [submissionSystemName, setSubmissionSystemName] = useState("UPSA Submission Ledger");

  return (
    <Panel>
      <Text style={styles.title}>Data operations</Text>
      <Text style={styles.muted}>Configure source systems and seed a realistic demo dataset.</Text>
      <TextInput value={assignmentSystemName} onChangeText={setAssignmentSystemName} placeholder="Assignment source system" placeholderTextColor={colors.textMuted} style={styles.input} />
      <Action label="Confirm assignment source" onPress={() => onSetSourceConfig({ sourceType: "assignment", systemName: assignmentSystemName, accessMethod: "import", minReliableFields: ["title", "courseCode", "dueAt", "student mapping"], status: "confirmed", notes: "Configured from admin dashboard" })} />
      <TextInput value={submissionSystemName} onChangeText={setSubmissionSystemName} placeholder="Submission source system" placeholderTextColor={colors.textMuted} style={styles.input} />
      <Action label="Confirm submission source" onPress={() => onSetSourceConfig({ sourceType: "submission", systemName: submissionSystemName, accessMethod: "import", minReliableFields: ["assignment id", "student id", "status", "submittedAt"], status: "confirmed", notes: "Configured from admin dashboard" })} />
      <Action label="Seed demo data" onPress={onSeedDemo} />
    </Panel>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, backgroundColor: colors.surfaceMuted, marginTop: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  buttonText: { color: "#07111f", fontWeight: "700", textAlign: "center" },
});
