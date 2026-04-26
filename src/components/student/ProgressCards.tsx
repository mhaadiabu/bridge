import { StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { formatPercent } from "@/utils/format";
import { colors } from "@/theme";

type Props = {
  data:
    | {
        metrics: { onTimeRate: number; missedRate: number; avgLeadHours: number };
        assignmentStateCounts: { dueSoon: number; overdue: number };
      }
    | undefined;
};

export function ProgressCards({ data }: Props) {
  if (!data) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <MetricCard label="On-time rate" value={formatPercent(data.metrics.onTimeRate)} helper="Submission discipline" />
        <MetricCard label="Missed rate" value={formatPercent(data.metrics.missedRate)} helper="Late risk" />
        <MetricCard label="Avg lead" value={`${Math.round(data.metrics.avgLeadHours)}h`} helper="Time before due" />
      </View>
      <Panel compact>
        <Text style={styles.muted}>Due soon: {data.assignmentStateCounts.dueSoon}</Text>
        <Text style={styles.muted}>Overdue: {data.assignmentStateCounts.overdue}</Text>
      </Panel>
    </View>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Panel compact style={styles.card}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.helper}>{helper}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { flex: 1, minWidth: 100 },
  muted: { color: colors.textMuted, fontSize: 12 },
  value: { color: colors.text, fontWeight: "700", fontSize: 18, marginTop: 4 },
  helper: { color: colors.primary, fontSize: 12, marginTop: 8 },
});
