import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { ensureResearchAccess } from "./lib/auth";
import { calculateLeadTimeHours, isOnTimeSubmission, resolveAssignmentStatus } from "./lib/assignment";

const assignmentRecordValidator = v.object({
  sourceId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  courseCode: v.string(),
  dueAt: v.number(),
  publishedAt: v.optional(v.number()),
  studentIds: v.array(v.string()),
});

const submissionRecordValidator = v.object({
  assignmentSourceId: v.string(),
  studentId: v.string(),
  status: v.union(v.literal("submitted"), v.literal("missed"), v.literal("resubmitted")),
  submittedAt: v.optional(v.number()),
});

export const ingestAssignments = mutation({
  args: { sourceSystem: v.string(), records: v.array(assignmentRecordValidator) },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const now = Date.now();
    const runId = await ctx.db.insert("ingestionRuns", {
      sourceSystem: args.sourceSystem,
      status: "running",
      startedAt: now,
      endedAt: undefined,
      recordsIngested: 0,
      errorMessage: undefined,
    });

    let recordsIngested = 0;
    try {
      for (const record of args.records) {
        let course = await ctx.db.query("courses").withIndex("by_code", (q) => q.eq("code", record.courseCode)).unique();
        if (!course) {
          const courseId = await ctx.db.insert("courses", {
            code: record.courseCode,
            name: record.courseCode,
            semester: undefined,
            createdAt: now,
            updatedAt: now,
          });
          course = await ctx.db.get(courseId);
        }

        const existingAssignment = await ctx.db
          .query("assignments")
          .withIndex("by_source", (q) => q.eq("sourceSystem", args.sourceSystem).eq("sourceId", record.sourceId))
          .unique();

        const assignmentId = existingAssignment
          ? existingAssignment._id
          : await ctx.db.insert("assignments", {
              sourceSystem: args.sourceSystem,
              sourceId: record.sourceId,
              title: record.title,
              description: record.description,
              courseId: course?._id,
              courseCode: record.courseCode,
              dueAt: record.dueAt,
              publishedAt: record.publishedAt,
              weight: undefined,
              createdAt: now,
              updatedAt: now,
            });

        if (existingAssignment) {
          await ctx.db.patch(existingAssignment._id, {
            title: record.title,
            description: record.description,
            courseId: course?._id,
            courseCode: record.courseCode,
            dueAt: record.dueAt,
            publishedAt: record.publishedAt,
            updatedAt: now,
          });
        }

        for (const studentId of record.studentIds) {
          const student = await ctx.db.query("profiles").withIndex("by_studentId", (q) => q.eq("studentId", studentId)).unique();
          if (!student) continue;

          const existingRecipient = await ctx.db
            .query("assignmentRecipients")
            .withIndex("by_student_assignment", (q) => q.eq("studentProfileId", student._id).eq("assignmentId", assignmentId))
            .first();
          const existingSubmission = await ctx.db
            .query("submissions")
            .withIndex("by_assignment_student", (q) => q.eq("assignmentId", assignmentId).eq("studentProfileId", student._id))
            .first();
          const computedStatus = resolveAssignmentStatus({ dueAt: record.dueAt, submittedAt: existingSubmission?.submittedAt, now });

          if (existingRecipient) {
            await ctx.db.patch(existingRecipient._id, {
              sourceStudentRef: studentId,
              assignmentDueAt: record.dueAt,
              status: computedStatus,
              updatedAt: now,
            });
          } else {
            await ctx.db.insert("assignmentRecipients", {
              assignmentId,
              studentProfileId: student._id,
              sourceStudentRef: studentId,
              assignmentDueAt: record.dueAt,
              assignedAt: now,
              status: computedStatus,
              lastViewedAt: undefined,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        recordsIngested += 1;
      }

      await ctx.db.patch(runId, { status: "succeeded", endedAt: Date.now(), recordsIngested });
      return { runId, recordsIngested };
    } catch (error) {
      await ctx.db.patch(runId, {
        status: "failed",
        endedAt: Date.now(),
        recordsIngested,
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error",
      });
      throw error;
    }
  },
});

export const ingestSubmissions = mutation({
  args: { sourceSystem: v.string(), records: v.array(submissionRecordValidator) },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const now = Date.now();
    const runId = await ctx.db.insert("ingestionRuns", {
      sourceSystem: args.sourceSystem,
      status: "running",
      startedAt: now,
      endedAt: undefined,
      recordsIngested: 0,
      errorMessage: undefined,
    });

    let recordsIngested = 0;
    try {
      for (const record of args.records) {
        const assignment = await ctx.db
          .query("assignments")
          .withIndex("by_source", (q) => q.eq("sourceSystem", args.sourceSystem).eq("sourceId", record.assignmentSourceId))
          .unique();
        if (!assignment) continue;

        const student = await ctx.db.query("profiles").withIndex("by_studentId", (q) => q.eq("studentId", record.studentId)).unique();
        if (!student) continue;

        const recipient = await ctx.db
          .query("assignmentRecipients")
          .withIndex("by_student_assignment", (q) => q.eq("studentProfileId", student._id).eq("assignmentId", assignment._id))
          .first();
        if (!recipient) continue;

        const submittedAt = record.status === "missed" ? undefined : record.submittedAt ?? Math.min(now, assignment.dueAt - 2 * 60 * 1000);
        const isOnTime = submittedAt ? isOnTimeSubmission(assignment.dueAt, submittedAt) : false;
        const leadTimeHours = submittedAt ? calculateLeadTimeHours(assignment.dueAt, submittedAt) : undefined;

        const existing = await ctx.db
          .query("submissions")
          .withIndex("by_assignment_student", (q) => q.eq("assignmentId", assignment._id).eq("studentProfileId", student._id))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            status: record.status,
            submittedAt,
            isOnTime,
            leadTimeHours,
            sourceSystem: args.sourceSystem,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("submissions", {
            assignmentId: assignment._id,
            studentProfileId: student._id,
            status: record.status,
            submittedAt,
            isOnTime,
            leadTimeHours,
            sourceSystem: args.sourceSystem,
            createdAt: now,
            updatedAt: now,
          });
        }

        const status = resolveAssignmentStatus({ dueAt: assignment.dueAt, submittedAt, now });
        await ctx.db.patch(recipient._id, { status, updatedAt: now });

        await ctx.db.insert("activityEvents", {
          studentProfileId: student._id,
          assignmentId: assignment._id,
          eventType: "submission_recorded",
          eventAt: now,
          payload: { status: record.status, submittedAt, sourceSystem: args.sourceSystem },
          experimentId: undefined,
          groupId: undefined,
        });

        recordsIngested += 1;
      }

      await ctx.db.patch(runId, { status: "succeeded", endedAt: Date.now(), recordsIngested });
      return { runId, recordsIngested };
    } catch (error) {
      await ctx.db.patch(runId, {
        status: "failed",
        endedAt: Date.now(),
        recordsIngested,
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error",
      });
      throw error;
    }
  },
});
