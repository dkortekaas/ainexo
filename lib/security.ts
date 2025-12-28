// lib/security.ts
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Log a security-related event to the database
 * @param userId User ID associated with the event
 * @param companyId Company ID associated with the event (optional)
 * @param eventType Type of security event
 * @param ipAddress IP address of the request
 * @param userAgent User agent string from the request
 * @param details Additional details about the event
 */
export async function logSecurityEvent(
  userId: string | undefined,
  companyId: string | undefined,
  eventType: string,
  ipAddress: string,
  userAgent: string,
  details: string = ""
): Promise<void> {
  try {
    await db.securityAuditLog.create({
      data: {
        userId,
        companyId,
        eventType,
        ipAddress,
        userAgent,
        details,
      },
    });
  } catch (error) {
    logger.error("Failed to log security event", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId,
      companyId,
      eventType,
      ipAddress,
      userAgent,
    });
    // We don't want to throw an error and break the main flow
    // Just log the failure and continue
  }
}

/**
 * Check if there have been too many failed attempts for a specific action
 * Used for rate limiting and preventing brute force attacks
 * @param userId User ID to check
 * @param eventType Type of event to check
 * @param timeWindowMinutes Time window in minutes to check for failures
 * @param maxAttempts Maximum number of attempts allowed in the time window
 * @returns Boolean indicating if the rate limit has been exceeded
 */
export async function checkRateLimit(
  userId: string,
  eventType: string,
  timeWindowMinutes: number = 15,
  maxAttempts: number = 5
): Promise<boolean> {
  try {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);

    // Count failed attempts within the time window
    const attemptCount = await db.securityAuditLog.count({
      where: {
        userId,
        eventType,
        timestamp: {
          gte: timeWindow,
        },
      },
    });

    return attemptCount >= maxAttempts;
  } catch (error) {
    logger.error("Failed to check rate limit", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId,
      eventType,
      timeWindowMinutes,
      maxAttempts,
    });
    // In case of error, we'll be conservative and allow the request
    return false;
  }
}

/**
 * Sanitize and normalize an IP address
 * @param ip Raw IP address from request
 * @returns Sanitized IP address
 */
export function sanitizeIp(ip: string | null): string {
  if (!ip) return "unknown";

  // Remove port number if present
  const ipWithoutPort = ip.split(":")[0];

  // Basic validation for IPv4 and IPv6
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Pattern.test(ipWithoutPort) || ipv6Pattern.test(ipWithoutPort)) {
    return ipWithoutPort;
  }

  return "invalid-ip";
}
