import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ensureResearchAccess } from "./lib/auth";

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await ensureResearchAccess(ctx);
    const now = Date.now();

    const currentStudentCount = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    if (currentStudentCount.length > 0) {
      return { seeded: false, message: "Demo data already exists. Skipping reseed." };
    }

    const sourceConfigAssignmentId = await ctx.db.insert("sourceConfigs", {
      sourceType: "assignment",
      systemName: "UPSA LMS Pilot Feed",
      accessMethod: "import",
      minReliableFields: ["assignment title", "course code", "dueAt", "student mapping"],
      status: "confirmed",
      notes: "Pilot dataset synced daily for MVP demo.",
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const sourceConfigSubmissionId = await ctx.db.insert("sourceConfigs", {
      sourceType: "submission",
      systemName: "UPSA Submission Ledger",
      accessMethod: "import",
      minReliableFields: ["assignment id", "student id", "status", "submittedAt"],
      status: "confirmed",
      notes: "Submission events imported from institutional export.",
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const cohortId = await ctx.db.insert("cohorts", {
      name: "Computer Science Year 3 - Pilot",
      description: "UPSA student pilot cohort for nudge evaluation.",
      year: "2026",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const students = [
      { name: "Ama Ofori", email: "ama.ofori@upsa.edu.gh", studentId: "UPSA-2026-001" },
      { name: "Kofi Mensah", email: "kofi.mensah@upsa.edu.gh", studentId: "UPSA-2026-002" },
      { name: "Efua Addo", email: "efua.addo@upsa.edu.gh", studentId: "UPSA-2026-003" },
      { name: "Yaw Boateng", email: "yaw.boateng@upsa.edu.gh", studentId: "UPSA-2026-004" },
      { name: "Nana Owusu", email: "nana.owusu@upsa.edu.gh", studentId: "UPSA-2026-005" },
      { name: "Abena Asare", email: "abena.asare@upsa.edu.gh", studentId: "UPSA-2026-006" },
    ];

    const studentProfileIds = await Promise.all(
      students.map(async (student, index) => {
        const profileId = await ctx.db.insert("profiles", {
          clerkId: `seed-student-${index + 1}`,
          email: student.email,
          fullName: student.name,
          role: "student",
          studentId: student.studentId,
          consentStatus: "granted",
          consentedAt: now - 10 * ONE_DAY,
          onboardingCompletedAt: now - 9 * ONE_DAY,
          preferredReminderHour: 18,
          timezone: "Africa/Accra",
          createdAt: now - 12 * ONE_DAY,
          updatedAt: now,
        });

        await ctx.db.insert("cohortMembers", {
          cohortId,
          studentProfileId: profileId,
          joinedAt: now - 9 * ONE_DAY,
        });

        return profileId;
      }),
    );

    const courseData = [
      { code: "CS301", name: "Software Engineering" },
      { code: "IS305", name: "Information Systems Research" },
      { code: "CS330", name: "Mobile App Development" },
    ];

    const courseIds = await Promise.all(
      courseData.map((course) =>
        ctx.db.insert("courses", {
          code: course.code,
          name: course.name,
          semester: "Sem 2",
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );

    const assignments = [
      { title: "Prototype Evaluation Report", description: "Submit your usability evaluation report.", courseCode: "IS305", dueAt: now + 14 * ONE_HOUR },
      { title: "REST API Integration Lab", description: "Complete and submit integration exercises.", courseCode: "CS301", dueAt: now + 52 * ONE_HOUR },
      { title: "Sprint Reflection Video", description: "Upload a short reflection video.", courseCode: "CS330", dueAt: now + 100 * ONE_HOUR },
      { title: "Testing Strategy Documentation", description: "Document your unit/integration testing strategy.", courseCode: "CS301", dueAt: now - 20 * ONE_HOUR },
    ];

    const assignmentRows: Array<{ id: Id<"assignments">; dueAt: number }> = [];
    for (let i = 0; i < assignments.length; i += 1) {
      const assignment = assignments[i];
      const courseId = courseIds[courseData.findIndex((course) => course.code === assignment.courseCode)];
      const assignmentId = await ctx.db.insert("assignments", {
        sourceSystem: "UPSA LMS Pilot Feed",
        sourceId: `seed-assignment-${i + 1}`,
        title: assignment.title,
        description: assignment.description,
        courseId,
        courseCode: assignment.courseCode,
        dueAt: assignment.dueAt,
        publishedAt: now - 5 * ONE_DAY,
        weight: 10 + i * 5,
        createdAt: now - 5 * ONE_DAY,
        updatedAt: now,
      });
      assignmentRows.push({ id: assignmentId, dueAt: assignment.dueAt });
    }

    for (let studentIndex = 0; studentIndex < studentProfileIds.length; studentIndex += 1) {
      const studentId = studentProfileIds[studentIndex];
      for (let assignmentIndex = 0; assignmentIndex < assignmentRows.length; assignmentIndex += 1) {
        const assignment = assignmentRows[assignmentIndex];
        const dueAt = assignment.dueAt;
        const patternSeed = studentIndex + assignmentIndex;
        const isSubmitted = patternSeed % 4 !== 0;
        const submittedOffsetHours = 4 + ((studentIndex * 3 + assignmentIndex * 5) % 28);
        const submittedAt = isSubmitted ? dueAt - submittedOffsetHours * ONE_HOUR : undefined;

        const status = submittedAt
          ? "submitted"
          : dueAt < now
            ? "overdue"
            : dueAt - now <= 72 * ONE_HOUR
              ? "dueSoon"
              : "upcoming";

        await ctx.db.insert("assignmentRecipients", {
          assignmentId: assignment.id,
          studentProfileId: studentId,
          sourceStudentRef: students[studentIndex]?.studentId,
          assignmentDueAt: dueAt,
          assignedAt: now - 4 * ONE_DAY,
          status,
          lastViewedAt: now - ((studentIndex + assignmentIndex) % 48) * ONE_HOUR,
          createdAt: now - 4 * ONE_DAY,
          updatedAt: now,
        });

        if (submittedAt || dueAt < now) {
          await ctx.db.insert("submissions", {
            assignmentId: assignment.id,
            studentProfileId: studentId,
            status: submittedAt ? "submitted" : "missed",
            submittedAt,
            isOnTime: submittedAt ? submittedAt <= dueAt : false,
            leadTimeHours: submittedAt ? (dueAt - submittedAt) / ONE_HOUR : undefined,
            sourceSystem: "UPSA Submission Ledger",
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    const strategyIds = {
      deadline: await ctx.db.insert("nudgeStrategies", {
        name: "Baseline Deadline Reminder",
        description: "Default schedule at 48h and 24h before deadline.",
        type: "deadline-reminder",
        config: { offsetsHours: [48, 24] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
      adaptive: await ctx.db.insert("nudgeStrategies", {
        name: "Adaptive Behavior Strategy v1",
        description: "Rule-based personalized timing and urgency.",
        type: "personalized-timing",
        config: { fallbackOffsets: [72, 36, 12] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
      motivational: await ctx.db.insert("nudgeStrategies", {
        name: "Motivational Momentum",
        description: "Encouragement nudges for low engagement cohorts.",
        type: "motivational",
        config: { offsetsHours: [48, 18] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
    };

    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.deadline,
      title: "Upcoming deadline",
      body: "{{assignment}} is due {{dueAt}}. Plan a focused work block today.",
      channel: "in-app",
      tone: "neutral",
      minHoursBeforeDue: 24,
      maxHoursBeforeDue: 72,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.adaptive,
      title: "Start early to stay ahead",
      body: "Based on your recent pattern, an earlier start on {{assignment}} gives better outcomes.",
      channel: "push",
      tone: "neutral",
      minHoursBeforeDue: 8,
      maxHoursBeforeDue: 96,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.motivational,
      title: "Momentum check",
      body: "A short sprint on {{assignment}} now will make deadline day calmer.",
      channel: "push",
      tone: "motivational",
      minHoursBeforeDue: 6,
      maxHoursBeforeDue: 72,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const experimentId = await ctx.db.insert("experiments", {
      name: "Adaptive vs Baseline Reminder Trial",
      hypothesis: "Adaptive timing improves on-time submission and lead time.",
      status: "running",
      cohortId,
      startAt: now - 2 * ONE_DAY,
      endAt: now + 20 * ONE_DAY,
      createdByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const controlGroupId = await ctx.db.insert("experimentGroups", {
      experimentId,
      name: "Control - Baseline",
      strategyId: strategyIds.deadline,
      allocationPercentage: 50,
      createdAt: now,
    });
    const treatmentGroupId = await ctx.db.insert("experimentGroups", {
      experimentId,
      name: "Treatment - Adaptive",
      strategyId: strategyIds.adaptive,
      allocationPercentage: 50,
      createdAt: now,
    });

    for (let i = 0; i < studentProfileIds.length; i += 1) {
      const profileId = studentProfileIds[i];
      const groupId = i % 2 === 0 ? controlGroupId : treatmentGroupId;
      await ctx.db.insert("experimentAssignments", {
        experimentId,
        groupId,
        studentProfileId: profileId,
        assignedAt: now - ONE_DAY,
        assignmentMethod: "random",
      });
    }

    await ctx.db.insert("ingestionRuns", {
      sourceSystem: "UPSA LMS Pilot Feed",
      status: "succeeded",
      startedAt: now - ONE_HOUR,
      endedAt: now - ONE_HOUR + 4 * 60 * 1000,
      recordsIngested: assignments.length + studentProfileIds.length,
      errorMessage: undefined,
    });
    await ctx.db.insert("ingestionRuns", {
      sourceSystem: "UPSA Submission Ledger",
      status: "succeeded",
      startedAt: now - ONE_HOUR,
      endedAt: now - ONE_HOUR + 3 * 60 * 1000,
      recordsIngested: studentProfileIds.length * 2,
      errorMessage: undefined,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: studentProfileIds[0],
      assignmentId: assignmentRows[0]?.id,
      eventType: "data_ingested",
      eventAt: now,
      payload: {
        assignmentSourceConfigId: sourceConfigAssignmentId,
        submissionSourceConfigId: sourceConfigSubmissionId,
      },
      experimentId,
      groupId: controlGroupId,
    });

    return {
      seeded: true,
      counts: { students: studentProfileIds.length, assignments: assignmentRows.length },
    };
  },
});
