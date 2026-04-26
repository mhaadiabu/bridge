import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureResearchAccess } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await ensureResearchAccess(ctx);
    const cohorts = await ctx.db.query("cohorts").collect();

    const enriched = await Promise.all(
      cohorts.map(async (cohort) => {
        const members = await ctx.db
          .query("cohortMembers")
          .withIndex("by_cohort", (q) => q.eq("cohortId", cohort._id))
          .collect();
        return {
          ...cohort,
          memberCount: members.length,
        };
      }),
    );

    return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    year: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("cohorts", {
      name: args.name,
      description: args.description,
      year: args.year,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const setActive = mutation({
  args: {
    cohortId: v.id("cohorts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    await ctx.db.patch(args.cohortId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.cohortId);
  },
});

export const listMembers = query({
  args: {
    cohortId: v.id("cohorts"),
  },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const members = await ctx.db
      .query("cohortMembers")
      .withIndex("by_cohort", (q) => q.eq("cohortId", args.cohortId))
      .collect();

    const rows = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db.get(member.studentProfileId);
        if (!profile) {
          return null;
        }
        return {
          _id: member._id,
          joinedAt: member.joinedAt,
          studentProfileId: profile._id,
          fullName: profile.fullName,
          email: profile.email,
          studentId: profile.studentId,
          consentStatus: profile.consentStatus,
        };
      }),
    );

    return rows.filter((row) => row !== null);
  },
});

export const addMember = mutation({
  args: {
    cohortId: v.id("cohorts"),
    studentProfileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const student = await ctx.db.get(args.studentProfileId);
    if (!student || student.role !== "student") {
      throw new Error("Only student profiles can be added to cohorts.");
    }

    const existing = await ctx.db
      .query("cohortMembers")
      .withIndex("by_cohort_student", (q) =>
        q.eq("cohortId", args.cohortId).eq("studentProfileId", args.studentProfileId),
      )
      .unique();

    if (existing) {
      return existing;
    }

    const id = await ctx.db.insert("cohortMembers", {
      cohortId: args.cohortId,
      studentProfileId: args.studentProfileId,
      joinedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

export const removeMember = mutation({
  args: {
    cohortId: v.id("cohorts"),
    studentProfileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    await ensureResearchAccess(ctx);
    const existing = await ctx.db
      .query("cohortMembers")
      .withIndex("by_cohort_student", (q) =>
        q.eq("cohortId", args.cohortId).eq("studentProfileId", args.studentProfileId),
      )
      .unique();
    if (!existing) {
      return { removed: false };
    }
    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});
