import type { Doc } from "../_generated/dataModel";
import { clampNumber } from "./time";

type NudgeType = Doc<"nudgeEvents">["type"];
type NudgeTone = Doc<"nudgeTemplates">["tone"];
type NudgeUrgency = Doc<"nudgeEvents">["urgency"];
type NudgeChannel = Doc<"nudgeEvents">["channel"];

export type StudentBehaviorSignals = {
  lateRate: number;
  openRate: number;
  averageLeadHours: number;
  submissionsCount: number;
};

export type NudgePlan = {
  type: NudgeType;
  tone: NudgeTone;
  urgency: NudgeUrgency;
  channel: NudgeChannel;
  scheduleOffsetsHours: number[];
  adaptationReason: string;
};

function normalizeRate(value: number) {
  return clampNumber(value, 0, 1);
}

export function deriveBehaviorSignals(
  submissions: Doc<"submissions">[],
  nudgeEvents: Doc<"nudgeEvents">[],
) {
  if (submissions.length === 0) {
    return {
      lateRate: 0.5,
      openRate: 0.4,
      averageLeadHours: 18,
      submissionsCount: 0,
    } satisfies StudentBehaviorSignals;
  }

  let lateCount = 0;
  let leadTotal = 0;
  let leadCount = 0;
  for (const submission of submissions) {
    if (!submission.isOnTime) {
      lateCount += 1;
    }
    if (typeof submission.leadTimeHours === "number") {
      leadTotal += submission.leadTimeHours;
      leadCount += 1;
    }
  }

  const openedCount = nudgeEvents.filter((n) => typeof n.openedAt === "number").length;
  const sentCount = nudgeEvents.filter(
    (n) => n.deliveryStatus === "sent" || n.deliveryStatus === "opened",
  ).length;

  return {
    lateRate: normalizeRate(lateCount / submissions.length),
    openRate: sentCount === 0 ? 0.4 : normalizeRate(openedCount / sentCount),
    averageLeadHours: leadCount === 0 ? 18 : leadTotal / leadCount,
    submissionsCount: submissions.length,
  } satisfies StudentBehaviorSignals;
}

export function chooseNudgePlan(hoursUntilDue: number, signals: StudentBehaviorSignals) {
  if (hoursUntilDue <= 8) {
    return {
      type: "escalating-urgency",
      tone: "urgent",
      urgency: "high",
      channel: "push",
      scheduleOffsetsHours: [6, 2],
      adaptationReason: "Deadline imminent. Escalating urgency with short-interval reminders.",
    } satisfies NudgePlan;
  }

  if (signals.lateRate >= 0.45) {
    return {
      type: "personalized-timing",
      tone: "neutral",
      urgency: hoursUntilDue <= 24 ? "high" : "medium",
      channel: signals.openRate < 0.3 ? "push" : "in-app",
      scheduleOffsetsHours: [72, 36, 12],
      adaptationReason:
        "Frequent late submissions detected. Nudges are scheduled earlier and more frequently.",
    } satisfies NudgePlan;
  }

  if (signals.openRate < 0.2) {
    return {
      type: "motivational",
      tone: "motivational",
      urgency: hoursUntilDue <= 24 ? "medium" : "low",
      channel: "push",
      scheduleOffsetsHours: [48, 18],
      adaptationReason:
        "Low nudge engagement detected. Switching to motivational messaging and push channel.",
    } satisfies NudgePlan;
  }

  if (signals.lateRate < 0.15 && signals.averageLeadHours > 20) {
    return {
      type: "progress-status",
      tone: "neutral",
      urgency: "low",
      channel: "in-app",
      scheduleOffsetsHours: [24],
      adaptationReason:
        "Strong on-time behavior detected. Applying lighter-touch progress reminders.",
    } satisfies NudgePlan;
  }

  if (signals.averageLeadHours < 6) {
    return {
      type: "commitment-style",
      tone: "commitment",
      urgency: hoursUntilDue <= 24 ? "high" : "medium",
      channel: "in-app",
      scheduleOffsetsHours: [36, 12, 4],
      adaptationReason:
        "Submissions cluster near deadlines. Applying commitment-style nudges to pull action earlier.",
    } satisfies NudgePlan;
  }

  return {
    type: "deadline-reminder",
    tone: "neutral",
    urgency: hoursUntilDue <= 24 ? "medium" : "low",
    channel: "in-app",
    scheduleOffsetsHours: [48, 24],
    adaptationReason: "Default reminder cadence based on assignment due date.",
  } satisfies NudgePlan;
}

export function pickNudgeCopy(
  type: NudgeType,
  tone: NudgeTone,
  assignmentTitle: string,
  dueAtLabel: string,
) {
  if (type === "escalating-urgency") {
    return {
      title: "Deadline almost here",
      message: `${assignmentTitle} is due ${dueAtLabel}. Start the final pass now to avoid a late submission.`,
    };
  }
  if (type === "motivational") {
    return {
      title: "Small progress now, calmer deadline later",
      message: `A focused 20-minute sprint on ${assignmentTitle} today can save stress before ${dueAtLabel}.`,
    };
  }
  if (type === "commitment-style") {
    return {
      title: "Lock in a submission plan",
      message: `Set your target: draft ${assignmentTitle} before ${dueAtLabel} and protect your on-time streak.`,
    };
  }
  if (type === "progress-status") {
    return {
      title: "Status check",
      message: `${assignmentTitle} is approaching ${dueAtLabel}. A quick review now keeps you comfortably ahead.`,
    };
  }
  if (type === "personalized-timing") {
    return {
      title: "Early reminder based on your pace",
      message: `${assignmentTitle} is due ${dueAtLabel}. Starting earlier has improved your outcomes before.`,
    };
  }
  if (tone === "urgent") {
    return {
      title: "Deadline reminder",
      message: `${assignmentTitle} is due ${dueAtLabel}. Prioritize it now to avoid being marked overdue.`,
    };
  }
  return {
    title: "Upcoming assignment",
    message: `${assignmentTitle} is due ${dueAtLabel}. Plan your next work block to stay on track.`,
  };
}
