import { useClerk } from "@clerk/expo";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { StateScreen } from "@/components/StateScreen";
import { Screen } from "@/components/Screen";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { DataTools } from "@/components/admin/DataTools";
import { ExperimentPanel } from "@/components/admin/ExperimentPanel";
import { PhaseZeroReadiness } from "@/components/admin/PhaseZeroReadiness";
import { ResearchSummary } from "@/components/admin/ResearchSummary";
import { AssignmentFilters } from "@/components/student/AssignmentFilters";
import { AssignmentList } from "@/components/student/AssignmentList";
import { BehaviorTimeline } from "@/components/student/BehaviorTimeline";
import { NudgeCenter } from "@/components/student/NudgeCenter";
import { ProgressCards } from "@/components/student/ProgressCards";
import { StudentOnboarding } from "@/components/student/StudentOnboarding";
import type { AssignmentStatusFilter, DashboardView } from "@/types/dashboard";

function studentStatusToApiFilter(status: AssignmentStatusFilter) {
  if (status === "all") {
    return undefined;
  }

  return status;
}

export function DashboardScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeView, setActiveView] = useState<DashboardView>("student");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentStatusFilter>("all");
  const [selectedExperimentId, setSelectedExperimentId] = useState<Id<"experiments"> | null>(null);
  const [hasEnsuredProfile, setHasEnsuredProfile] = useState(false);

  const ensureViewer = useMutation(api.profiles.ensureViewer);
  const updateConsent = useMutation(api.profiles.updateViewerConsent);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);
  const refreshStatuses = useMutation(api.assignments.refreshViewerStatuses);
  const generateNudges = useMutation(api.nudges.generateForViewer);
  const dispatchNudges = useMutation(api.nudges.dispatchDueNudges);
  const markNudgeOpened = useMutation(api.nudges.markOpened);
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const upsertSourceConfig = useMutation(api.sources.upsertSourceConfig);
  const createExperiment = useMutation(api.experiments.createExperiment);
  const setExperimentStatus = useMutation(api.experiments.setExperimentStatus);

  const viewer = useQuery(api.profiles.getViewer);
  const assignments = useQuery(api.assignments.listForViewer, {
    status: studentStatusToApiFilter(assignmentFilter),
    search: undefined,
  });
  const progress = useQuery(api.assignments.getViewerProgress);
  const nudges = useQuery(api.nudges.listForViewer, { includeScheduled: true });
  const phaseZeroReadiness = useQuery(api.sources.getPhaseZeroReadiness);
  const dashboardSummary = useQuery(api.analytics.getDashboardSummary, {});
  const activityLog = useQuery(api.analytics.listActivityLog, { limit: 30 });
  const strategies = useQuery(api.experiments.listStrategies);
  const cohorts = useQuery(api.cohorts.list);
  const experiments = useQuery(api.experiments.listExperiments);
  const comparison = useQuery(
    api.experiments.getExperimentComparison,
    selectedExperimentId ? { experimentId: selectedExperimentId } : "skip",
  );

  useEffect(() => {
    if (hasEnsuredProfile) {
      return;
    }

    void ensureViewer().finally(() => setHasEnsuredProfile(true));
  }, [ensureViewer, hasEnsuredProfile]);

  useEffect(() => {
    if (!viewer || !experiments || selectedExperimentId || experiments.length === 0) {
      return;
    }

    setSelectedExperimentId(experiments[0]._id);
  }, [experiments, selectedExperimentId, viewer]);

  const normalizedAssignments = useMemo(() => {
    if (!assignments) {
      return [];
    }

    return assignments.map((assignment) => ({
      ...assignment,
      submittedAt: assignment.submittedAt ?? null,
    }));
  }, [assignments]);

  if (!viewer) {
    return <StateScreen title="Bootstrapping profile..." loading />;
  }

  const canAccessAdmin = viewer.role === "admin" || viewer.role === "researcher";
  const currentView = canAccessAdmin ? activeView : "student";

  return (
    <Screen>
      <AppShell
        title="UPSA Bridge"
        subtitle="Digital nudge system MVP for assignment discipline"
        viewerName={viewer.fullName ?? viewer.email}
        roleLabel={viewer.role}
        activeView={currentView}
        canAccessAdmin={canAccessAdmin}
        onViewChange={setActiveView}
        onSignOut={() => {
          void signOut();
        }}
      >
        {currentView === "student" ? (
          <View style={styles.stack}>
            <StudentOnboarding
              consentStatus={viewer.consentStatus}
              onboardingCompletedAt={viewer.onboardingCompletedAt}
              isSaving={false}
              onUpdateConsent={(granted) => {
                void updateConsent({ granted });
              }}
              onCompleteOnboarding={(payload) => {
                void completeOnboarding(payload);
              }}
            />
            <ProgressCards data={progress ?? undefined} />
            <AssignmentFilters value={assignmentFilter} onChange={setAssignmentFilter} />
            <AssignmentList
              items={normalizedAssignments}
              isLoading={!assignments}
              onSelect={(assignmentRecipientId) => {
                router.push({
                  pathname: "/assignments/[assignmentRecipientId]",
                  params: { assignmentRecipientId },
                });
              }}
            />
            <NudgeCenter
              items={nudges ?? undefined}
              onGenerate={() => {
                void refreshStatuses({});
                void generateNudges({ force: false });
              }}
              onDispatch={() => {
                void dispatchNudges({});
              }}
              onOpenNudge={(nudgeEventId) => {
                void markNudgeOpened({ nudgeEventId: nudgeEventId as Id<"nudgeEvents"> });
              }}
            />
            <BehaviorTimeline timeline={progress?.timeline ?? undefined} />
          </View>
        ) : (
          <View style={styles.stack}>
            <PhaseZeroReadiness data={phaseZeroReadiness ?? undefined} />
            <ResearchSummary data={dashboardSummary ?? undefined} />
            <DataTools
              onSeedDemo={() => {
                void seedDemoData({});
              }}
              onSetSourceConfig={(payload) => {
                void upsertSourceConfig(payload);
              }}
            />
            <ExperimentPanel
              strategies={strategies ?? undefined}
              cohorts={cohorts ?? undefined}
              experiments={experiments ?? undefined}
              comparison={comparison ?? undefined}
              onCreateExperiment={(payload) => {
                void createExperiment({
                  name: payload.name,
                  hypothesis: payload.hypothesis,
                  cohortId: payload.cohortId as Id<"cohorts">,
                  groups: payload.groups.map((group) => ({
                    name: group.name,
                    strategyId: group.strategyId as Id<"nudgeStrategies">,
                    allocationPercentage: group.allocationPercentage,
                  })),
                  assignmentMethod: "random",
                });
              }}
              onSetStatus={(experimentId, status) => {
                void setExperimentStatus({ experimentId: experimentId as Id<"experiments">, status });
              }}
              onSelectExperiment={(experimentId) => {
                setSelectedExperimentId(experimentId as Id<"experiments">);
              }}
            />
            <ActivityLog events={activityLog ?? undefined} />
          </View>
        )}
      </AppShell>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
});
