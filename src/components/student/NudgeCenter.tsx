import { Pressable, StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { formatShortDate } from "@/utils/format";
import { colors } from "@/theme";

type Item = { _id: string; title: string; message: string; channel: "in-app" | "push"; urgency: "low" | "medium" | "high"; deliveryStatus: string; scheduledFor: number; adaptationReason?: string };
type Props = { items: Item[] | undefined; onGenerate: () => void; onDispatch: () => void; onOpenNudge: (id: string) => void };

export function NudgeCenter({ items, onGenerate, onDispatch, onOpenNudge }: Props) {
  return (
    <Panel>
      <Text style={styles.title}>Nudge center</Text>
      <Text style={styles.muted}>Adaptive nudges, delivery states, and explanations.</Text>
      <View style={styles.actions}>
        <Action label="Generate nudges" onPress={onGenerate} />
        <Action label="Dispatch due" onPress={onDispatch} muted />
      </View>
      {!items || items.length === 0 ? (
        <Text style={styles.muted}>No nudge events yet. Generate your first adaptive nudges.</Text>
      ) : (
        items.slice(0, 6).map((item, index) => (
          <View key={item._id} style={[styles.row, index < Math.min(items.length, 6) - 1 && styles.rowBorder]}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.message}</Text>
            <Text style={styles.meta}>{item.deliveryStatus.toUpperCase()} via {item.channel} · {formatShortDate(item.scheduledFor)}</Text>
            {item.adaptationReason ? <Text style={styles.meta}>Reason: {item.adaptationReason}</Text> : null}
            <Pressable onPress={() => onOpenNudge(item._id)}><Text style={styles.link}>Mark as opened</Text></Pressable>
          </View>
        ))
      )}
    </Panel>
  );
}

function Action({ label, onPress, muted }: { label: string; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.action, muted ? styles.actionMuted : null]}>
      <Text style={[styles.actionText, muted ? styles.actionTextMuted : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  action: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  actionMuted: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  actionText: { color: "#07111f", fontWeight: "700", textAlign: "center" },
  actionTextMuted: { color: colors.text },
  row: { paddingVertical: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemTitle: { color: colors.text, fontWeight: "700", fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  link: { color: colors.primary, fontWeight: "700", marginTop: 8 },
});
