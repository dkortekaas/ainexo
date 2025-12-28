/**
 * Feedback Learning System
 * Learn from user feedback to continuously improve answer quality
 */

import { db } from "./db";

export interface FeedbackEntry {
  id: string;
  messageId: string;
  sessionId: string;
  query: string;
  answer: string;
  confidence: number;
  sources: string[];
  feedbackType: "positive" | "negative";
  feedbackScore?: number; // 1-5 stars
  feedbackComment?: string;
  timestamp: number;
}

export interface LearningInsight {
  pattern: string;
  occurrences: number;
  averageConfidence: number;
  positiveRatio: number;
  recommendation: string;
}

/**
 * Feedback Learning Manager
 */
export class FeedbackLearner {
  private feedbackHistory: FeedbackEntry[] = [];
  private readonly MAX_HISTORY = 5000;

  /**
   * Record user feedback
   */
  async recordFeedback(feedback: {
    messageId: string;
    sessionId: string;
    query: string;
    answer: string;
    confidence: number;
    sources: string[];
    feedbackType: "positive" | "negative";
    feedbackScore?: number;
    feedbackComment?: string;
  }): Promise<void> {
    const entry: FeedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...feedback,
      timestamp: Date.now(),
    };

    this.feedbackHistory.push(entry);

    // Limit history size
    if (this.feedbackHistory.length > this.MAX_HISTORY) {
      this.feedbackHistory = this.feedbackHistory.slice(-this.MAX_HISTORY);
    }

    // Persist to database
    try {
      await db.messageFeedback.create({
        data: {
          messageId: feedback.messageId,
          sessionId: feedback.sessionId,
          rating:
            feedback.feedbackType === "positive" ? "THUMBS_UP" : "THUMBS_DOWN",
          feedback: feedback.feedbackComment || undefined,
        },
      });

      console.log(
        `📝 Recorded ${feedback.feedbackType} feedback for message ${feedback.messageId}`
      );
    } catch (error) {
      console.error("❌ Failed to persist feedback:", error);
    }

    // Trigger learning if we have enough feedback
    if (this.feedbackHistory.length % 100 === 0) {
      this.analyzeAndLearn();
    }
  }

  /**
   * Analyze feedback patterns and generate insights
   */
  analyzeAndLearn(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Pattern 1: Low confidence but positive feedback
    const lowConfidencePositive = this.feedbackHistory.filter(
      (f) => f.confidence < 0.6 && f.feedbackType === "positive"
    );

    if (lowConfidencePositive.length > 10) {
      insights.push({
        pattern: "Low confidence threshold may be too strict",
        occurrences: lowConfidencePositive.length,
        averageConfidence:
          lowConfidencePositive.reduce((sum, f) => sum + f.confidence, 0) /
          lowConfidencePositive.length,
        positiveRatio: 1.0,
        recommendation:
          "Consider lowering confidence threshold from 0.5 to 0.4",
      });
    }

    // Pattern 2: High confidence but negative feedback
    const highConfidenceNegative = this.feedbackHistory.filter(
      (f) => f.confidence > 0.8 && f.feedbackType === "negative"
    );

    if (highConfidenceNegative.length > 5) {
      insights.push({
        pattern: "High confidence scores despite poor answers",
        occurrences: highConfidenceNegative.length,
        averageConfidence:
          highConfidenceNegative.reduce((sum, f) => sum + f.confidence, 0) /
          highConfidenceNegative.length,
        positiveRatio: 0.0,
        recommendation:
          "Review confidence calculation algorithm - may be over-confident",
      });
    }

    // Pattern 3: Common query patterns with negative feedback
    const queryPatterns = this.identifyNegativequeryPatterns();
    insights.push(...queryPatterns);

    // Pattern 4: Source quality analysis
    const sourceInsights = this.analyzeSourceQuality();
    insights.push(...sourceInsights);

    // Log insights
    if (insights.length > 0) {
      console.log("🧠 Learning Insights Generated:");
      insights.forEach((insight, i) => {
        console.log(`  ${i + 1}. ${insight.pattern}`);
        console.log(`     Occurrences: ${insight.occurrences}`);
        console.log(`     Recommendation: ${insight.recommendation}`);
      });
    }

    return insights;
  }

  /**
   * Identify query patterns that frequently get negative feedback
   */
  private identifyNegativequeryPatterns(): LearningInsight[] {
    const patterns: LearningInsight[] = [];
    const negativeFeedback = this.feedbackHistory.filter(
      (f) => f.feedbackType === "negative"
    );

    // Group by query similarity (simple word-based for now)
    const queryGroups = new Map<string, FeedbackEntry[]>();

    negativeFeedback.forEach((feedback) => {
      const queryWords = feedback.query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const key = queryWords.slice(0, 3).sort().join("_");

      if (!queryGroups.has(key)) {
        queryGroups.set(key, []);
      }
      queryGroups.get(key)!.push(feedback);
    });

    // Find patterns with multiple occurrences
    queryGroups.forEach((entries, pattern) => {
      if (entries.length >= 3) {
        const sampleQuery = entries[0].query;
        patterns.push({
          pattern: `Repeated issues with queries like: "${sampleQuery}"`,
          occurrences: entries.length,
          averageConfidence:
            entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length,
          positiveRatio: 0,
          recommendation: `Add FAQ or improve knowledge base for: ${pattern.replace(/_/g, " ")}`,
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze which sources lead to better/worse feedback
   */
  private analyzeSourceQuality(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Group feedback by source types
    const sourceStats = new Map<
      string,
      { positive: number; negative: number }
    >();

    this.feedbackHistory.forEach((feedback) => {
      feedback.sources.forEach((source) => {
        if (!sourceStats.has(source)) {
          sourceStats.set(source, { positive: 0, negative: 0 });
        }

        const stats = sourceStats.get(source)!;
        if (feedback.feedbackType === "positive") {
          stats.positive++;
        } else {
          stats.negative++;
        }
      });
    });

    // Identify problematic sources
    sourceStats.forEach((stats, source) => {
      const total = stats.positive + stats.negative;
      if (total >= 5) {
        // Minimum sample size
        const positiveRatio = stats.positive / total;

        if (positiveRatio < 0.3) {
          insights.push({
            pattern: `Source "${source}" has low satisfaction`,
            occurrences: total,
            averageConfidence: 0,
            positiveRatio,
            recommendation: `Review or update source: ${source}`,
          });
        }
      }
    });

    return insights;
  }

  /**
   * Get recommended confidence threshold based on feedback
   */
  getRecommendedConfidenceThreshold(): number {
    if (this.feedbackHistory.length < 50) {
      return 0.5; // Default threshold
    }

    // Find optimal threshold that maximizes F1 score
    const thresholds = [0.3, 0.4, 0.5, 0.6, 0.7];
    let bestThreshold = 0.5;
    let bestF1 = 0;

    thresholds.forEach((threshold) => {
      const accepted = this.feedbackHistory.filter(
        (f) => f.confidence >= threshold
      );
      const rejected = this.feedbackHistory.filter(
        (f) => f.confidence < threshold
      );

      const truePositives = accepted.filter(
        (f) => f.feedbackType === "positive"
      ).length;
      const falsePositives = accepted.filter(
        (f) => f.feedbackType === "negative"
      ).length;
      const falseNegatives = rejected.filter(
        (f) => f.feedbackType === "positive"
      ).length;

      const precision = truePositives / (truePositives + falsePositives || 1);
      const recall = truePositives / (truePositives + falseNegatives || 1);
      const f1 = (2 * (precision * recall)) / (precision + recall || 1);

      if (f1 > bestF1) {
        bestF1 = f1;
        bestThreshold = threshold;
      }
    });

    console.log(
      `🎯 Recommended confidence threshold: ${bestThreshold} (F1: ${bestF1.toFixed(3)})`
    );
    return bestThreshold;
  }

  /**
   * Get feedback statistics
   */
  getStatistics() {
    const total = this.feedbackHistory.length;
    if (total === 0) {
      return {
        totalFeedback: 0,
        positiveRatio: 0,
        averageRating: 0,
        averageConfidence: 0,
      };
    }

    const positive = this.feedbackHistory.filter(
      (f) => f.feedbackType === "positive"
    ).length;
    const withRating = this.feedbackHistory.filter(
      (f) => f.feedbackScore !== undefined
    );

    return {
      totalFeedback: total,
      positiveRatio: positive / total,
      averageRating:
        withRating.length > 0
          ? withRating.reduce((sum, f) => sum + (f.feedbackScore || 0), 0) /
            withRating.length
          : 0,
      averageConfidence:
        this.feedbackHistory.reduce((sum, f) => sum + f.confidence, 0) / total,
    };
  }

  /**
   * Export feedback data for external analysis
   */
  exportFeedbackData(): FeedbackEntry[] {
    return [...this.feedbackHistory];
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations(): string[] {
    const insights = this.analyzeAndLearn();
    const stats = this.getStatistics();
    const recommendations: string[] = [];

    // Overall satisfaction
    if (stats.positiveRatio < 0.7 && stats.totalFeedback >= 20) {
      recommendations.push(
        `⚠️ Overall satisfaction is ${(stats.positiveRatio * 100).toFixed(0)}%. Target is 70%+`
      );
    }

    // Confidence calibration
    const threshold = this.getRecommendedConfidenceThreshold();
    if (threshold !== 0.5) {
      recommendations.push(`🎯 Adjust confidence threshold to ${threshold}`);
    }

    // Add insights as recommendations
    insights.forEach((insight) => {
      if (insight.occurrences >= 5) {
        recommendations.push(`📊 ${insight.recommendation}`);
      }
    });

    // Rating-specific
    if (stats.averageRating > 0 && stats.averageRating < 3.5) {
      recommendations.push(
        `⭐ Average rating is ${stats.averageRating.toFixed(1)}/5. Review prompt quality`
      );
    }

    return recommendations;
  }

  /**
   * Clear all feedback history
   */
  clear(): void {
    this.feedbackHistory = [];
    console.log("🧹 Cleared feedback learning history");
  }
}

// Global feedback learner instance
export const feedbackLearner = new FeedbackLearner();

/**
 * Auto-adjust system parameters based on feedback
 */
export function applyLearnings(): {
  confidenceThreshold: number;
  shouldUpdateKnowledgeBase: boolean;
  problematicSources: string[];
} {
  const threshold = feedbackLearner.getRecommendedConfidenceThreshold();
  const insights = feedbackLearner.analyzeAndLearn();

  const problematicSources = insights
    .filter((i) => i.pattern.includes("Source") && i.positiveRatio < 0.3)
    .map((i) => i.pattern);

  const shouldUpdateKB = insights.some(
    (i) => i.pattern.includes("FAQ") || i.pattern.includes("knowledge base")
  );

  return {
    confidenceThreshold: threshold,
    shouldUpdateKnowledgeBase: shouldUpdateKB,
    problematicSources,
  };
}
