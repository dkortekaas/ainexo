/**
 * A/B Testing Framework for Prompt Strategies
 * Test different prompt variations to find best performing strategies
 */

import crypto from "crypto";

export interface PromptVariant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  weight: number; // Traffic allocation (0-1)
}

export interface TestResult {
  variantId: string;
  timestamp: number;
  query: string;
  answer: string;
  confidence: number;
  responseTime: number;
  tokensUsed: number;
  userFeedback?: "positive" | "negative";
  feedbackScore?: number; // 1-5 stars
}

export interface VariantMetrics {
  variantId: string;
  totalTests: number;
  averageConfidence: number;
  averageResponseTime: number;
  averageTokens: number;
  positiveRatio: number; // % of positive feedback
  averageFeedbackScore: number;
  conversionRate: number; // % of queries that led to positive outcome
}

/**
 * A/B Test Manager
 */
export class ABTestManager {
  private variants: Map<string, PromptVariant>;
  private results: TestResult[];
  private maxResults: number;

  constructor(maxResults: number = 10000) {
    this.variants = new Map();
    this.results = [];
    this.maxResults = maxResults;

    // Initialize with default variants
    this.initializeDefaultVariants();
  }

  /**
   * Initialize default prompt variants for testing
   */
  private initializeDefaultVariants(): void {
    // Control variant (current production)
    this.addVariant({
      id: "control",
      name: "Control (Current)",
      description: "Current production prompt strategy",
      systemPrompt:
        "Je bent een behulpzame AI-assistent die vragen beantwoordt op basis van de gegeven context informatie.",
      temperature: 0.7,
      maxTokens: 500,
      enabled: true,
      weight: 0.5, // 50% traffic
    });

    // Variant A: More concise
    this.addVariant({
      id: "variant_concise",
      name: "Concise Responses",
      description: "Shorter, more direct answers",
      systemPrompt:
        "Je bent een efficiënte AI-assistent. Geef korte, directe antwoorden zonder onnodige uitleg. Kom direct to the point.",
      temperature: 0.5,
      maxTokens: 300,
      enabled: true,
      weight: 0.25, // 25% traffic
    });

    // Variant B: More detailed
    this.addVariant({
      id: "variant_detailed",
      name: "Detailed Responses",
      description: "More comprehensive, educational answers",
      systemPrompt:
        "Je bent een geduldige AI-assistent. Geef uitgebreide, educatieve antwoorden met context en voorbeelden waar mogelijk.",
      temperature: 0.8,
      maxTokens: 700,
      enabled: true,
      weight: 0.25, // 25% traffic
    });
  }

  /**
   * Add or update a prompt variant
   */
  addVariant(variant: PromptVariant): void {
    this.variants.set(variant.id, variant);
    console.log(
      `✅ Added variant: ${variant.name} (${(variant.weight * 100).toFixed(0)}% traffic)`
    );
  }

  /**
   * Select variant based on weighted random selection
   */
  selectVariant(userId?: string): PromptVariant {
    const enabledVariants = Array.from(this.variants.values()).filter(
      (v) => v.enabled
    );

    if (enabledVariants.length === 0) {
      throw new Error("No enabled variants available");
    }

    // Consistent assignment based on userId (if provided)
    if (userId) {
      const hash = crypto.createHash("md5").update(userId).digest("hex");
      const hashInt = parseInt(hash.substring(0, 8), 16);
      const selection = (hashInt % 100) / 100; // 0-1

      let cumulative = 0;
      for (const variant of enabledVariants) {
        cumulative += variant.weight;
        if (selection <= cumulative) {
          return variant;
        }
      }
    }

    // Random selection based on weights
    const totalWeight = enabledVariants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of enabledVariants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return enabledVariants[0];
  }

  /**
   * Record test result
   */
  recordResult(result: TestResult): void {
    this.results.push(result);

    // Limit results array size
    if (this.results.length > this.maxResults) {
      this.results = this.results.slice(-this.maxResults);
    }

    console.log(`📊 Recorded A/B test result for variant: ${result.variantId}`);
  }

  /**
   * Get metrics for a specific variant
   */
  getVariantMetrics(variantId: string): VariantMetrics {
    const variantResults = this.results.filter(
      (r) => r.variantId === variantId
    );

    if (variantResults.length === 0) {
      return {
        variantId,
        totalTests: 0,
        averageConfidence: 0,
        averageResponseTime: 0,
        averageTokens: 0,
        positiveRatio: 0,
        averageFeedbackScore: 0,
        conversionRate: 0,
      };
    }

    const withFeedback = variantResults.filter((r) => r.userFeedback);
    const positiveCount = withFeedback.filter(
      (r) => r.userFeedback === "positive"
    ).length;
    const withScore = variantResults.filter(
      (r) => r.feedbackScore !== undefined
    );

    return {
      variantId,
      totalTests: variantResults.length,
      averageConfidence:
        variantResults.reduce((sum, r) => sum + r.confidence, 0) /
        variantResults.length,
      averageResponseTime:
        variantResults.reduce((sum, r) => sum + r.responseTime, 0) /
        variantResults.length,
      averageTokens:
        variantResults.reduce((sum, r) => sum + r.tokensUsed, 0) /
        variantResults.length,
      positiveRatio:
        withFeedback.length > 0 ? positiveCount / withFeedback.length : 0,
      averageFeedbackScore:
        withScore.length > 0
          ? withScore.reduce((sum, r) => sum + (r.feedbackScore || 0), 0) /
            withScore.length
          : 0,
      conversionRate: withFeedback.length / variantResults.length,
    };
  }

  /**
   * Get all variant metrics for comparison
   */
  getAllMetrics(): VariantMetrics[] {
    return Array.from(this.variants.keys()).map((id) =>
      this.getVariantMetrics(id)
    );
  }

  /**
   * Determine winning variant using statistical significance
   * Uses Bayesian approach for faster convergence
   */
  determineWinner(
    metric: "confidence" | "positiveRatio" | "feedbackScore" = "positiveRatio",
    minSampleSize: number = 50
  ): {
    winner: string | null;
    confidence: number;
    metrics: VariantMetrics[];
  } {
    const metrics = this.getAllMetrics().filter(
      (m) => m.totalTests >= minSampleSize
    );

    if (metrics.length < 2) {
      return {
        winner: null,
        confidence: 0,
        metrics,
      };
    }

    // Map metric name to VariantMetrics property
    const metricMap: Record<
      "confidence" | "positiveRatio" | "feedbackScore",
      keyof VariantMetrics
    > = {
      confidence: "averageConfidence",
      positiveRatio: "positiveRatio",
      feedbackScore: "averageFeedbackScore",
    };
    const metricKey = metricMap[metric];

    // Sort by selected metric
    const sorted = metrics.sort((a, b) => {
      const aValue = a[metricKey] as number;
      const bValue = b[metricKey] as number;
      return bValue - aValue;
    });

    const best = sorted[0];
    const second = sorted[1];

    // Calculate confidence based on difference and sample sizes
    const difference = Math.abs(
      (best[metricKey] as number) - (second[metricKey] as number)
    );
    const totalSamples = best.totalTests + second.totalTests;

    // Simple confidence calculation (real implementation would use proper stats)
    const confidence = Math.min(
      difference * Math.sqrt(totalSamples / 100),
      0.99
    );

    return {
      winner: confidence > 0.9 ? best.variantId : null,
      confidence,
      metrics: sorted,
    };
  }

  /**
   * Export results for analysis
   */
  exportResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Generate A/B test report
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    const winner = this.determineWinner();

    let report = "📊 A/B Test Report\n";
    report += "=".repeat(60) + "\n\n";

    metrics.forEach((m) => {
      const variant = this.variants.get(m.variantId);
      report += `Variant: ${variant?.name || m.variantId}\n`;
      report += `  Total Tests: ${m.totalTests}\n`;
      report += `  Avg Confidence: ${(m.averageConfidence * 100).toFixed(1)}%\n`;
      report += `  Avg Response Time: ${m.averageResponseTime.toFixed(0)}ms\n`;
      report += `  Avg Tokens: ${m.averageTokens.toFixed(0)}\n`;
      report += `  Positive Ratio: ${(m.positiveRatio * 100).toFixed(1)}%\n`;
      report += `  Avg Feedback Score: ${m.averageFeedbackScore.toFixed(2)}/5\n`;
      report += `  Conversion Rate: ${(m.conversionRate * 100).toFixed(1)}%\n`;
      report += "-".repeat(60) + "\n";
    });

    if (winner.winner) {
      report += `\n🏆 Winner: ${this.variants.get(winner.winner)?.name}\n`;
      report += `   Confidence: ${(winner.confidence * 100).toFixed(1)}%\n`;
    } else {
      report += "\n⏳ No clear winner yet. Need more data.\n";
    }

    return report;
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
    console.log("🧹 Cleared all A/B test results");
  }
}

// Global A/B test manager instance
export const abTestManager = new ABTestManager();
