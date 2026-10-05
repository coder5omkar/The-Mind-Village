import { NextResponse } from "next/server";

// TEMPORARY diagnostic endpoint. Remove once the deployment is healthy.
// It never prints secret values - only presence checks and scrubbed errors.

export const dynamic = "force-dynamic";

function scrub(text: string) {
  return text
    .replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgres://***")
    .replace(/apikey_[A-Za-z0-9_]+/g, "apikey_***")
    .replace(/jv_live_[A-Za-z0-9_]+/g, "jv_live_***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***");
}

function describe(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: scrub(error.message),
      stack: error.stack
        ? scrub(error.stack.split("\n").slice(0, 6).join(" | "))
        : null,
    };
  }
  return { name: "Unknown", message: scrub(String(error)), stack: null };
}

export async function GET() {
  const result: Record<string, unknown> = {
    runtime: {
      node: process.version,
      platform: process.platform,
      hasNavigator: typeof navigator !== "undefined",
      navigatorUserAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      cwd: process.cwd(),
      awsExecutionEnv: process.env.AWS_EXECUTION_ENV ?? null,
    },
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      JEV_API_KEY: Boolean(process.env.JEV_API_KEY),
    },
  };

  try {
    const pg = await import("pg");
    result.pg = {
      ok: true,
      version: (pg as { version?: string }).version ?? null,
    };
  } catch (error) {
    result.pg = { ok: false, ...describe(error) };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.resident.count();
    result.database = { ok: true, residents: count };
  } catch (error) {
    result.database = { ok: false, ...describe(error) };
  }

  try {
    const auth = await import("@/lib/auth");
    result.nextAuth = { ok: true, hasOptions: Boolean(auth.authOptions) };
  } catch (error) {
    result.nextAuth = { ok: false, ...describe(error) };
  }

  return NextResponse.json(result);
}
