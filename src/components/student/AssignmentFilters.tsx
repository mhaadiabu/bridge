import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AssignmentStatusFilter } from "@/types/dashboard";
import { colors } from "@/theme";
import { Panel } from "@/components/Panel";

type Props = { value: AssignmentStatusFilter; onChange: (value: AssignmentStatusFilter) => void };

const FILTERS: Array<{ value: AssignmentStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "dueSoon", label: "Due Soon" },
  { value: "overdue", label: "Overdue" },
  { value: "submitted", label: "Submitted" },
];

export function AssignmentFilters({ value, onChange }: Props) {
  return (
    <Panel compact>
      <View style={styles.row}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={[styles.tab, value === filter.value && styles.tabActive]}
          >
            <Text style={styles.tabText}>{filter.label}</Text>
          </Pressable>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "600", fontSize: 12 },
});
