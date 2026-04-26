import { StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { formatShortDate } from "@/utils/format";
import { colors } from "@/theme";

type Props = { events: any[] | undefined };

export function ActivityLog({ events }: Props) {
  return (
    <Panel>
      <Text style={styles.title}>Evaluation event log</Text>
      {!events || events.length === 0 ? (
        <Text style={styles.muted}>No activity events yet.</Text>
      ) : (
        events.slice(0, 12).map((event, index) => (
          <View key={event._id} style={[styles.row, index < Math.min(events.length, 12) - 1 && styles.rowBorder]}>
            <View style={styles.rowBetween}>
              <Text style={styles.text}>{event.eventType}</Text>
              <Text style={styles.muted}>{formatShortDate(event.eventAt)}</Text>
            </View>
            <Text style={styles.muted}>Student {event.studentProfileId}{event.experimentId ? ` · Experiment ${event.experimentId}` : ""}</Text>
          </View>
        ))
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { paddingVertical: 10 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  text: { color: colors.text, fontSize: 13, fontWeight: "600" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
