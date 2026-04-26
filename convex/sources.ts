import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureResearchAccess } from "./lib/auth";

export const listSourceConfigs = query({
  args: {},
  handler: async (ctx) => {
    await ensureResearchAccess(ctx);
    const configs = await ctx.db.query("sourceConfigs").collect();
    return configs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const upsertSourceConfig = mutation({
  args: {
    sourceType: v.union(v.literal("assignment"), v.literal("submission")),
    systemName: v.string(),
    accessMethod: v.union(v.literal("api"), v.literal("database"), v.literal("import")),
    minReliableFields: v.array(v.string()),
    status: v.union(v.literal("pending"), v.literal("confirmed")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureResearchAccess(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("sourceConfigs")
      .withIndex("by_sourceType", (q) => q.eq("sourceType", args.sourceType))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedByProfileId: actor._id,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("sourceConfigs", {
      ...args,
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const getPhaseZeroReadiness = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("sourceConfigs").collect();
    const assignmentConfig = configs.find((c) => c.sourceType === "assignment");
    const submissionConfig = configs.find((c) => c.sourceType === "submission");

    const hasAssignmentSource = assignmentConfig?.status === "confirmed";
    const hasSubmissionSource = submissionConfig?.status === "confirmed";

    return {
      assignmentSource: assignmentConfig ?? null,
      submissionSource: submissionConfig ?? null,
      confirmedAccessMethod:
        assignmentConfig?.accessMethod && submissionConfig?.accessMethod
          ? `${assignmentConfig.accessMethod}/${submissionConfig.accessMethod}`
          : null,
      hasAssignmentSource,
      hasSubmissionSource,
      isReady: hasAssignmentSource && hasSubmissionSource,
      openQuestions: {
        assignmentSourceSystem: hasAssignmentSource,
        submissionSourceSystem: hasSubmissionSource,
        accessMethod: Boolean(assignmentConfig?.accessMethod && submissionConfig?.accessMethod),
        minimumReliableFields:
          (assignmentConfig?.minReliableFields.length ?? 0) >= 4 &&
          (submissionConfig?.minReliableFields.length ?? 0) >= 3,
        experimentSetupRequirements: true,
      },
    };
  },
});
