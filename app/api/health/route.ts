import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";
import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";
import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Health Check Status Types
 */
type HealthStatus = "healthy" | "degraded" | "unhealthy";

type ServiceCheck = {
  status: "ok" | "error" | "warning";
  message?: string;
  responseTime?: number;
  details?: Record<string, any>;
};

type HealthCheckResponse = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ServiceCheck;
    stripe: ServiceCheck;
    openai: ServiceCheck;
    redis: ServiceCheck;
    filesystem: ServiceCheck;
    sentry?: ServiceCheck;
  };
  system?: {
    memory: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
    platform: string;
    nodeVersion: string;
  };
};

/**
 * Health Check Endpoint
 *
 * GET /api/health
 * GET /api/health?detailed=true (includes system info)
 *
 * Returns:
 * - 200: All systems operational
 * - 207: Some systems degraded but functional
 * - 503: Critical systems unavailable
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const detailed = searchParams.get("detailed") === "true";

  const checks: HealthCheckResponse["checks"] = {
    database: { status: "ok" },
    stripe: { status: "ok" },
    openai: { status: "ok" },
    redis: { status: "ok" },
    filesystem: { status: "ok" },
  };

  // Run all health checks in parallel
  const [databaseCheck, stripeCheck, openaiCheck, redisCheck, filesystemCheck] =
    await Promise.allSettled([
      checkDatabase(),
      checkStripe(),
      checkOpenAI(),
      checkRedis(),
      checkFilesystem(),
    ]);

  // Process database check
  if (databaseCheck.status === "fulfilled") {
    checks.database = databaseCheck.value;
  } else {
    checks.database = {
      status: "error",
      message: databaseCheck.reason?.message || "Database check failed",
    };
  }

  // Process Stripe check
  if (stripeCheck.status === "fulfilled") {
    checks.stripe = stripeCheck.value;
  } else {
    checks.stripe = {
      status: "error",
      message: stripeCheck.reason?.message || "Stripe check failed",
    };
  }

  // Process OpenAI check
  if (openaiCheck.status === "fulfilled") {
    checks.openai = openaiCheck.value;
  } else {
    checks.openai = {
      status: "error",
      message: openaiCheck.reason?.message || "OpenAI check failed",
    };
  }

  // Process Redis check
  if (redisCheck.status === "fulfilled") {
    checks.redis = redisCheck.value;
  } else {
    checks.redis = {
      status: "error",
      message: redisCheck.reason?.message || "Redis check failed",
    };
  }

  // Process filesystem check
  if (filesystemCheck.status === "fulfilled") {
    checks.filesystem = filesystemCheck.value;
  } else {
    checks.filesystem = {
      status: "error",
      message: filesystemCheck.reason?.message || "Filesystem check failed",
    };
  }

  // Check if Sentry is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
    checks.sentry = {
      status: "ok",
      message: "Sentry is configured",
    };
  }

  // Determine overall health status
  const healthStatus = determineOverallHealth(checks);

  const response: HealthCheckResponse = {
    status: healthStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
    checks,
  };

  // Add system info if detailed=true
  if (detailed) {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    response.system = {
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      platform: os.platform(),
      nodeVersion: process.version,
    };
  }

  // Determine HTTP status code
  let statusCode = 200;
  if (healthStatus === "degraded") {
    statusCode = 207; // Multi-Status
  } else if (healthStatus === "unhealthy") {
    statusCode = 503; // Service Unavailable
  }

  // Log to Sentry if unhealthy
  if (healthStatus === "unhealthy") {
    Sentry.captureMessage("Health check failed - system unhealthy", {
      level: "error",
      extra: {
        checks,
        responseTime: Date.now() - startTime,
      },
    });
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Status": healthStatus,
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  });
}

/**
 * Database Health Check
 */
async function checkDatabase(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    await db.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      message: "Database connection successful",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Database connection failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Stripe API Health Check
 */
async function checkStripe(): Promise<ServiceCheck> {
  const startTime = Date.now();

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      status: "warning",
      message: "Stripe API key not configured",
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-08-27.basil",
    });

    // Lightweight API call to check connectivity
    await stripe.balance.retrieve();

    return {
      status: "ok",
      message: "Stripe API connection successful",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Stripe API connection failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * OpenAI API Health Check
 */
async function checkOpenAI(): Promise<ServiceCheck> {
  const startTime = Date.now();

  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "warning",
      message: "OpenAI API key not configured",
    };
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Lightweight API call to check connectivity
    await openai.models.list();

    return {
      status: "ok",
      message: "OpenAI API connection successful",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "OpenAI API connection failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Redis Health Check
 */
async function checkRedis(): Promise<ServiceCheck> {
  const startTime = Date.now();

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return {
      status: "warning",
      message: "Redis credentials not configured",
    };
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test write and read
    const testKey = `health-check:${Date.now()}`;
    await redis.set(testKey, "ok", { ex: 10 }); // Expires in 10 seconds
    const value = await redis.get(testKey);
    await redis.del(testKey);

    if (value !== "ok") {
      throw new Error("Redis read/write test failed");
    }

    return {
      status: "ok",
      message: "Redis connection successful",
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Redis connection failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Filesystem Health Check
 */
async function checkFilesystem(): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    // Use /tmp directory which is writable in Vercel and most environments
    const testDir = path.join(os.tmpdir(), "embediq-health-check");
    const testFile = path.join(testDir, `test-${Date.now()}.txt`);

    // Ensure directory exists
    await fs.mkdir(testDir, { recursive: true });

    // Test write
    await fs.writeFile(testFile, "health-check-test", "utf-8");

    // Test read
    const content = await fs.readFile(testFile, "utf-8");

    // Test delete
    await fs.unlink(testFile);

    if (content !== "health-check-test") {
      throw new Error("Filesystem read/write test failed");
    }

    return {
      status: "ok",
      message: "Filesystem write permissions OK",
      responseTime: Date.now() - startTime,
      details: {
        testPath: testDir,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Filesystem check failed",
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Determine overall health status based on individual checks
 */
function determineOverallHealth(
  checks: HealthCheckResponse["checks"]
): HealthStatus {
  const criticalServices = ["database"];
  const importantServices = ["stripe", "openai", "filesystem"];

  // Check if any critical service is down
  for (const service of criticalServices) {
    if (checks[service as keyof typeof checks]?.status === "error") {
      return "unhealthy";
    }
  }

  // Check if any important service is down
  let degradedCount = 0;
  for (const service of importantServices) {
    const check = checks[service as keyof typeof checks];
    if (check?.status === "error") {
      degradedCount++;
    }
  }

  // If more than 1 important service is down, system is degraded
  if (degradedCount > 1) {
    return "degraded";
  }

  // Check for warnings
  const hasWarnings = Object.values(checks).some(
    (check) => check?.status === "warning"
  );

  if (degradedCount === 1 || hasWarnings) {
    return "degraded";
  }

  return "healthy";
}
