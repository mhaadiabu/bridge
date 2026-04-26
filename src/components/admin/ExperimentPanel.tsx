import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { colors } from "@/theme";

type Props = {
  strategies: any[] | undefined;
  cohorts: any[] | undefined;
  experiments: any[] | undefined;
  comparison: any;
  onCreateExperiment: (payload: { name: string; hypothesis: string; cohortId: string; groups: Array<{ name: string; strategyId: string; allocationPercentage: number }> }) => void;
  onSetStatus: (experimentId: string, status: "draft" | "running" | "paused" | "completed") => void;
  onSelectExperiment: (experimentId: string) => void;
};

export function ExperimentPanel({ strategies, cohorts, experiments, comparison, onCreateExperiment, onSetStatus, onSelectExperiment }: Props) {
  const [name, setName] = useState("UPSA adaptive nudge trial");
  const [hypothesis, setHypothesis] = useState("Adaptive timing improves on-time submission.");
  const [cohortId, setCohortId] = useState(cohorts?.[0]?._id ?? "");
  const [controlStrategy, setControlStrategy] = useState(strategies?.[0]?._id ?? "");
  const [treatmentStrategy, setTreatmentStrategy] = useState(strategies?.[1]?._id ?? strategies?.[0]?._id ?? "");

  const canCreate = useMemo(() => Boolean(name.trim() && cohortId && controlStrategy && treatmentStrategy), [name, cohortId, controlStrategy, treatmentStrategy]);

  return (
    <Panel>
      <Text style={styles.title}>Experiment management</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput value={hypothesis} onChangeText={setHypothesis} placeholder="Hypothesis" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput value={cohortId} onChangeText={setCohortId} placeholder="Cohort ID" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput value={controlStrategy} onChangeText={setControlStrategy} placeholder="Control strategy ID" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput value={treatmentStrategy} onChangeText={setTreatmentStrategy} placeholder="Treatment strategy ID" placeholderTextColor={colors.textMuted} style={styles.input} />
      <Action disabled={!canCreate} label="Create experiment" onPress={() => onCreateExperiment({ name, hypothesis, cohortId, groups: [{ name: "Control", strategyId: controlStrategy, allocationPercentage: 50 }, { name: "Treatment", strategyId: treatmentStrategy, allocationPercentage: 50 }] })} />
      {experiments?.slice(0, 4).map((experiment) => (
        <View key={experiment._id} style={styles.block}>
          <Text style={styles.blockTitle}>{experiment.name}</Text>
          <Text style={styles.muted}>Participants: {experiment.participantCount} · {experiment.status}</Text>
          <View style={styles.row}>
            <LinkButton label="Compare" onPress={() => onSelectExperiment(experiment._id)} />
            <LinkButton label="Run" onPress={() => onSetStatus(experiment._id, "running")} />
            <LinkButton label="Pause" onPress={() => onSetStatus(experiment._id, "paused")} />
          </View>
        </View>
      ))}
      {comparison ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{comparison.experiment.name}</Text>
          {comparison.groups.map((group: any) => (
            <View key={group.groupId} style={styles.rowBetween}>
              <Text style={styles.muted}>{group.groupName}</Text>
              <Text style={styles.text}>On-time {group.onTimeRate}% · Open {group.nudgeOpenRate}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Panel>
  );
}

function Action({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled ? styles.buttonDisabled : null]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress}><Text style={styles.link}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, backgroundColor: colors.surfaceMuted, marginTop: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#07111f", fontWeight: "700", textAlign: "center" },
  block: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 6 },
  blockTitle: { color: colors.text, fontWeight: "700", fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 12 },
  text: { color: colors.text, fontSize: 12 },
  row: { flexDirection: "row", gap: 12, marginTop: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 4 },
  link: { color: colors.primary, fontWeight: "700" },
});
