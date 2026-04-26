import { StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { formatPercent } from "@/utils/format";
import { colors } from "@/theme";

type Props = { timeline: Array<{ period: string; total: number; onTimeRate: number; missedRate: number }> | undefined };

export function BehaviorTimeline({ timeline }: Props) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <Panel>
      <Text style={styles.title}>Behavior trend</Text>
      {timeline.slice(-4).map((point) => (
        <View key={point.period} style={styles.row}>
          <Text style={styles.muted}>{point.period}</Text>
          <View style={styles.right}>
            <Text style={styles.text}>On-time {formatPercent(point.onTimeRate)}</Text>
            <Text style={styles.muted}>Missed {formatPercent(point.missedRate)} · {point.total} submissions</Text>
          </View>
        </View>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 8 },
  right: { alignItems: "flex-end" },
  text: { color: colors.text, fontSize: 14, fontWeight: "600" },
  muted: { color: colors.textMuted, fontSize: 12 },
});
