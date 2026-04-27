import { z } from "zod";

const publicEnvSchema = z.object({
  EXPO_PUBLIC_CONVEX_URL: z.url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

const rawPublicEnv = {
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
};

const parsedPublicEnv = publicEnvSchema.safeParse(rawPublicEnv);

export const env = parsedPublicEnv.success ? parsedPublicEnv.data : null;

export const envValidationError = parsedPublicEnv.success
  ? null
  : parsedPublicEnv.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
