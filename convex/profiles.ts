import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  ensureResearchAccess,
  getIdentityEmail,
  getIdentityName,
  getIdentityOrThrow,
  getViewerProfile,
  inferRoleFromEmail,
  isPrivilegedRole,
} from "./lib/auth";

type ProfileRole = Doc<"profiles">["role"];

export const ensureViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentityOrThrow(ctx);
    const now = Date.now();
    const email = getIdentityEmail(identity);
    const fullName = getIdentityName(identity);

    const existing = await getViewerProfile(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        fullName,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const role = inferRoleFromEmail(email);
    const id = await ctx.db.insert("profiles", {
      clerkId: identity.subject,
      email,
      fullName,
      role,
      studentId:
        role === "student" ? `UPSA-${identity.subject.slice(-6).toUpperCase()}` : undefined,
      consentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    return getViewerProfile(ctx);
  },
});

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    await ensureResearchAccess(ctx);
    const students = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();
    return students.map((student) => ({
      _id: student._id,
      fullName: student.fullName,
      email: student.email,
      studentId: student.studentId,
      consentStatus: student.consentStatus,
      onboardingCompletedAt: student.onboardingCompletedAt,
    }));
  },
});

export const updateViewerConsent = mutation({
  args: {
    granted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      throw new Error("Profile not initialized.");
    }

    const now = Date.now();
    const consentStatus: Doc<"profiles">["consentStatus"] = args.granted ? "granted" : "declined";
    await ctx.db.patch(profile._id, {
      consentStatus,
      consentedAt: args.granted ? now : undefined,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: profile._id,
      assignmentId: undefined,
      eventType: "consent_updated",
      eventAt: now,
      payload: { granted: args.granted },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(profile._id);
  },
});

export const completeOnboarding = mutation({
  args: {
    preferredReminderHour: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      throw new Error("Profile not initialized.");
    }

    const now = Date.now();
    await ctx.db.patch(profile._id, {
      preferredReminderHour: args.preferredReminderHour,
      timezone: args.timezone,
      onboardingCompletedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: profile._id,
      assignmentId: undefined,
      eventType: "onboarding_completed",
      eventAt: now,
      payload: {
        preferredReminderHour: args.preferredReminderHour,
        timezone: args.timezone,
      },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(profile._id);
  },
});

export const setRole = mutation({
  args: {
    profileId: v.id("profiles"),
    role: v.union(v.literal("student"), v.literal("admin"), v.literal("researcher")),
  },
  handler: async (ctx, args) => {
    const actor = await ensureResearchAccess(ctx);
    const target = await ctx.db.get(args.profileId);
    if (!target) {
      throw new Error("Profile not found.");
    }

    if (!isPrivilegedRole(actor.role) && args.role !== "student") {
      throw new Error("Insufficient permission to assign elevated roles.");
    }

    const now = Date.now();
    const patch: {
      role: ProfileRole;
      studentId?: string;
      updatedAt: number;
    } = {
      role: args.role,
      updatedAt: now,
    };

    if (args.role === "student" && !target.studentId) {
      patch.studentId = `UPSA-${target.clerkId.slice(-6).toUpperCase()}`;
    }

    await ctx.db.patch(target._id, patch);
    return await ctx.db.get(target._id);
  },
});
