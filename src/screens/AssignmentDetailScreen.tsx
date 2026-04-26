import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Panel } from "@/components/Panel";
import { Screen } from "@/components/Screen";
import { getStatusLabel } from "@/utils/assignmentPresentation";
import { formatShortDate } from "@/utils/format";
import { colors } from "@/theme";

type AssignmentDetailScreenProps = {
  assignmentRecipientId: string;
  onBack: () => void;
};

export function AssignmentDetailScreen({ assignmentRecipientId, onBack }: AssignmentDetailScreenProps) {
  const assignmentRecipientDocId = assignmentRecipientId as Id<"assignmentRecipients">;
  const assignmentDetail = useQuery(api.assignments.getDetail, {
    assignmentRecipientId: assignmentRecipientDocId,
  });

  const markViewed = useMutation(api.assignments.markViewed);
  const recordSubmission = useMutation(api.assignments.recordSubmission);

  useEffect(() => {
    void markViewed({ assignmentRecipientId: assignmentRecipientDocId });
  }, [assignmentRecipientDocId, markViewed]);

  if (!assignmentDetail) {
    return (
      <Screen scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.mutedText}>Loading assignment details...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <Panel>
        <Text style={styles.title}>{assignmentDetail.assignment.title}</Text>
        <Text style={styles.mutedText}>{assignmentDetail.assignment.courseCode}</Text>
        <Text style={styles.bodyText}>Status: {getStatusLabel(assignmentDetail.status)}</Text>
        {assignmentDetail.assignment.description ? (
          <Text style={styles.bodyText}>{assignmentDetail.assignment.description}</Text>
        ) : null}
        <Text style={styles.bodyText}>Due: {formatShortDate(assignmentDetail.assignment.dueAt)}</Text>

        <Pressable
          onPress={() => void recordSubmission({ assignmentId: assignmentDetail.assignment._id })}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {assignmentDetail.status === "submitted" ? "Already submitted" : "Mark as submitted"}
          </Text>
        </Pressable>
      </Panel>

      <Panel>
        <Text style={styles.sectionTitle}>Nudge history</Text>
        {assignmentDetail.nudgeHistory.length === 0 ? (
          <Text style={styles.mutedText}>No nudges have been sent for this assignment yet.</Text>
        ) : (
          assignmentDetail.nudgeHistory.slice(0, 8).map((nudge) => (
            <View key={nudge._id} style={styles.nudgeRow}>
              <Text style={styles.bodyText}>{nudge.title}</Text>
              <Text style={styles.mutedText}>{nudge.message}</Text>
              {nudge.sentAt ? <Text style={styles.mutedText}>Sent {formatShortDate(nudge.sentAt)}</Text> : null}
            </View>
          ))
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#07111f",
    fontWeight: "700",
    textAlign: "center",
  },
  nudgeRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
