import { type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DashboardView } from "@/types/dashboard";
import { colors } from "@/theme";
import { Panel } from "@/components/Panel";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  viewerName: string;
  roleLabel: string;
  activeView: DashboardView;
  canAccessAdmin: boolean;
  onViewChange: (value: DashboardView) => void;
  onSignOut: () => void;
}>;

export function AppShell({
  title,
  subtitle,
  viewerName,
  roleLabel,
  activeView,
  canAccessAdmin,
  onViewChange,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <View style={styles.container}>
      <Panel>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Pressable onPress={onSignOut} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.viewer}>{viewerName}</Text>
            <Text style={styles.muted}>Role: {roleLabel}</Text>
          </View>
          <Text style={styles.muted}>Android-first MVP</Text>
        </View>

        {canAccessAdmin ? (
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => onViewChange("student")}
              style={[styles.tab, activeView === "student" && styles.tabActive]}
            >
              <Text style={styles.tabText}>Student</Text>
            </Pressable>
            <Pressable
              onPress={() => onViewChange("admin")}
              style={[styles.tab, activeView === "admin" && styles.tabActive]}
            >
              <Text style={styles.tabText}>Research</Text>
            </Pressable>
          </View>
        ) : null}
      </Panel>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  metaRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  viewer: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  muted: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tabRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
});
