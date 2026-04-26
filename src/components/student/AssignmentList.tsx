import { Pressable, StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { getLeadTimeSummary, getStatusLabel } from "@/utils/assignmentPresentation";
import { formatShortDate } from "@/utils/format";
import { colors } from "@/theme";

type Item = {
  assignmentRecipientId: string;
  title: string;
  description?: string;
  courseCode: string;
  dueAt: number;
  status: string;
  submittedAt: number | null;
  leadTimeHours: number | null;
};

type Props = { items: Item[] | undefined; isLoading: boolean; onSelect: (id: string) => void };

export function AssignmentList({ items, isLoading, onSelect }: Props) {
  if (!items || items.length === 0) {
    return (
      <Panel>
        <Text style={styles.title}>{isLoading ? "Loading assignments..." : "No assignments match this filter"}</Text>
        <Text style={styles.muted}>
          {isLoading ? "Syncing assignment and deadline data." : "Try another filter or seed demo data."}
        </Text>
      </Panel>
    );
  }

  return (
    <Panel>
      {items.map((item, index) => (
        <Pressable key={item.assignmentRecipientId} onPress={() => onSelect(item.assignmentRecipientId)} style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted}>{item.courseCode} · {getStatusLabel(item.status)}</Text>
            {item.description ? <Text numberOfLines={2} style={styles.muted}>{item.description}</Text> : null}
            <Text style={styles.meta}>Due {formatShortDate(item.dueAt)}</Text>
            <Text style={styles.meta}>{getLeadTimeSummary(item.leadTimeHours, item.submittedAt)}</Text>
          </View>
        </Pressable>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  textBlock: { gap: 4 },
  title: { color: colors.text, fontWeight: "700", fontSize: 16 },
  muted: { color: colors.textMuted, fontSize: 13 },
  meta: { color: colors.textMuted, fontSize: 12 },
});
