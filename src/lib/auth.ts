import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@db/index";
import * as authSchema from "@db/auth-schema";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: isProduction
    ? {
        allowedHosts: [
          "*.vercel.app",
          ...(process.env.BETTER_AUTH_URL?.startsWith("http")
            ? [new URL(process.env.BETTER_AUTH_URL).host]
            : []),
        ],
        protocol: "https",
      }
    : undefined,
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...(process.env.BETTER_AUTH_URL
      ? [process.env.BETTER_AUTH_URL.replace(/\/$/, "")]
      : []),
  ],
  advanced: isProduction ? { useSecureCookies: true } : undefined,
});
