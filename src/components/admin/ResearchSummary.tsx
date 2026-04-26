import { StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { formatPercent } from "@/utils/format";
import { colors } from "@/theme";

type Props = { data: any };

export function ResearchSummary({ data }: Props) {
  if (!data) return null;

  return (
    <Panel>
      <Text style={styles.title}>Outcome summary</Text>
      <Text style={styles.muted}>{data.studentCount} students</Text>
      <View style={styles.metrics}>
        <Text style={styles.text}>On-time {formatPercent(data.submissionMetrics.onTimeRate)}</Text>
        <Text style={styles.text}>Missed {formatPercent(data.submissionMetrics.missedRate)}</Text>
        <Text style={styles.text}>Avg lead {Math.round(data.submissionMetrics.avgLeadHours)}h</Text>
        <Text style={styles.text}>Overdue {data.submissionMetrics.overdueCount}</Text>
      </View>
      <Text style={styles.subtitle}>Nudge engagement</Text>
      <Text style={styles.muted}>Sent {data.nudgeMetrics.sentCount} · Opened {data.nudgeMetrics.openedCount} · Open rate {formatPercent(data.nudgeMetrics.openRate)}</Text>
      {data.nudgeMetrics.byType.slice(0, 4).map((item: any) => (
        <View key={item.type} style={styles.row}>
          <Text style={styles.muted}>{item.type}</Text>
          <Text style={styles.text}>{formatPercent(item.openRate)} open</Text>
        </View>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  subtitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 12 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  text: { color: colors.text, fontSize: 13 },
  metrics: { gap: 4, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
});
