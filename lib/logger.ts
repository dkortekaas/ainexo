/**
 * Logger utility for consistent logging across the application
 * Supports different log levels and structured logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.minLevel =
      (process.env.LOG_LEVEL as LogLevel) ||
      (this.isDevelopment ? "debug" : "info");
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): string {
    const timestamp = new Date().toISOString();
    const metadataString = metadata ? ` ${JSON.stringify(metadata)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataString}`;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, metadata);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug information (only in development or when DEBUG is enabled)
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log("debug", message, metadata);
  }

  /**
   * Log general information
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log("info", message, metadata);
  }

  /**
   * Log warnings
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log("warn", message, metadata);
  }

  /**
   * Log errors
   */
  error(message: string, metadata?: LogMetadata): void {
    this.log("error", message, metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogMetadata };
