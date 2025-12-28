/**
 * Custom Re-ranking for Search Results
 * Domain-specific and context-aware re-ranking to improve result quality
 */

import { SearchResult } from "./search";

export interface RerankingStrategy {
  name: string;
  weight: number;
  scorer: (result: SearchResult, context: RerankingContext) => number;
}

export interface RerankingContext {
  query: string;
  queryType?: 'question' | 'keyword' | 'command';
  userPreferences?: {
    preferredSources?: string[]; // Preferred document types
    recentTopics?: string[]; // Recent conversation topics
  };
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Detect query type for different ranking strategies
 */
function detectQueryType(query: string): 'question' | 'keyword' | 'command' {
  const queryLower = query.toLowerCase();

  // Question indicators
  const questionWords = ['wat', 'hoe', 'waarom', 'wanneer', 'waar', 'wie', 'welke', 'what', 'how', 'why', 'when', 'where', 'who', 'which'];
  if (questionWords.some(word => queryLower.startsWith(word))) {
    return 'question';
  }

  // Command indicators
  const commandWords = ['toon', 'geef', 'show', 'give', 'list', 'zoek', 'search', 'vind', 'find'];
  if (commandWords.some(word => queryLower.startsWith(word))) {
    return 'command';
  }

  return 'keyword';
}

/**
 * Recency booster: prefer recently updated/created content
 */
const recencyStrategy: RerankingStrategy = {
  name: 'recency',
  weight: 0.15,
  scorer: (result, context) => {
    // Extract timestamp from metadata if available
    const timestamp = result.metadata?.createdAt || result.metadata?.updatedAt || result.metadata?.scrapedAt;

    if (!timestamp) return 0.5; // Neutral score if no timestamp

    const now = Date.now();
    const ageMs = now - new Date(timestamp).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);

    // Decay function: newer = higher score
    if (ageDays < 7) return 1.0;        // Last week
    if (ageDays < 30) return 0.8;       // Last month
    if (ageDays < 90) return 0.6;       // Last quarter
    if (ageDays < 365) return 0.4;      // Last year
    return 0.2;                         // Older
  },
};

/**
 * Source type preference: prefer certain types based on query
 */
const sourceTypeStrategy: RerankingStrategy = {
  name: 'sourceType',
  weight: 0.2,
  scorer: (result, context) => {
    const queryType = context.queryType || detectQueryType(context.query);

    // For questions: prefer FAQs and documents
    if (queryType === 'question') {
      if (result.type === 'faq') return 1.0;
      if (result.type === 'document') return 0.8;
      if (result.type === 'website_page') return 0.6;
      return 0.4;
    }

    // For keywords: prefer documents and websites
    if (queryType === 'keyword') {
      if (result.type === 'document') return 1.0;
      if (result.type === 'website_page') return 0.9;
      if (result.type === 'website') return 0.7;
      return 0.5;
    }

    // Default: all types equally weighted
    return 0.7;
  },
};

/**
 * Content length preference: prefer substantive content for complex queries
 */
const contentLengthStrategy: RerankingStrategy = {
  name: 'contentLength',
  weight: 0.1,
  scorer: (result, context) => {
    const contentLength = result.content.length;
    const queryLength = context.query.length;

    // For short queries: prefer concise answers
    if (queryLength < 20) {
      if (contentLength < 200) return 1.0;
      if (contentLength < 500) return 0.8;
      return 0.6;
    }

    // For long/complex queries: prefer detailed content
    if (queryLength > 50) {
      if (contentLength > 500) return 1.0;
      if (contentLength > 200) return 0.8;
      return 0.5;
    }

    // Medium queries: balanced preference
    if (contentLength >= 150 && contentLength <= 500) return 1.0;
    return 0.7;
  },
};

/**
 * Title match booster: prefer results with query terms in title
 */
const titleMatchStrategy: RerankingStrategy = {
  name: 'titleMatch',
  weight: 0.25,
  scorer: (result, context) => {
    const queryTerms = context.query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const titleLower = result.title.toLowerCase();

    const matchCount = queryTerms.filter(term => titleLower.includes(term)).length;
    const matchRatio = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

    return Math.min(matchRatio * 1.5, 1.0); // Boost up to 1.5x
  },
};

/**
 * Conversation context relevance: prefer topics from recent conversation
 */
const conversationContextStrategy: RerankingStrategy = {
  name: 'conversationContext',
  weight: 0.2,
  scorer: (result, context) => {
    if (!context.conversationHistory || context.conversationHistory.length === 0) {
      return 0.5; // Neutral if no history
    }

    // Extract key terms from recent conversation
    const recentMessages = context.conversationHistory.slice(-3);
    const conversationText = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // Check if result content relates to conversation topics
    const resultText = (result.title + ' ' + result.content).toLowerCase();
    const conversationTerms = conversationText.split(/\s+/).filter(t => t.length > 4);

    const uniqueTerms = [...new Set(conversationTerms)];
    const matchCount = uniqueTerms.filter(term => resultText.includes(term)).length;

    if (matchCount === 0) return 0.5;
    if (matchCount >= 3) return 1.0;
    return 0.5 + (matchCount / 6); // Gradual boost
  },
};

/**
 * Diversity promoter: penalize results that are too similar to already-ranked results
 */
const diversityStrategy: RerankingStrategy = {
  name: 'diversity',
  weight: 0.1,
  scorer: (result, context) => {
    // This would be implemented with already-ranked results
    // For now, slight preference for different source types
    return 0.8;
  },
};

/**
 * Default re-ranking strategies
 */
const DEFAULT_STRATEGIES: RerankingStrategy[] = [
  titleMatchStrategy,
  sourceTypeStrategy,
  conversationContextStrategy,
  recencyStrategy,
  contentLengthStrategy,
  diversityStrategy,
];

/**
 * Re-rank search results using multiple strategies
 */
export function rerankResults(
  results: SearchResult[],
  context: RerankingContext,
  strategies: RerankingStrategy[] = DEFAULT_STRATEGIES
): SearchResult[] {
  // Detect query type if not provided
  const enrichedContext: RerankingContext = {
    ...context,
    queryType: context.queryType || detectQueryType(context.query),
  };

  // Calculate composite score for each result
  const scoredResults = results.map(result => {
    // Start with original search score
    let compositeScore = result.score * 0.3; // 30% weight to original score

    // Add weighted scores from each strategy
    strategies.forEach(strategy => {
      const strategyScore = strategy.scorer(result, enrichedContext);
      compositeScore += strategyScore * strategy.weight;
    });

    return {
      ...result,
      originalScore: result.score,
      rerankScore: compositeScore,
      score: compositeScore, // Update score
    };
  });

  // Sort by composite score
  const reranked = scoredResults.sort((a, b) => b.rerankScore - a.rerankScore);

  console.log('🎯 Re-ranked results:');
  reranked.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.type}] ${r.title}`);
    console.log(`     Original: ${(r.originalScore * 100).toFixed(0)}% → Re-ranked: ${(r.rerankScore * 100).toFixed(0)}%`);
  });

  return reranked;
}

/**
 * Create domain-specific re-ranking strategies
 */
export function createDomainStrategy(
  domain: 'ecommerce' | 'support' | 'documentation' | 'general',
  customWeights?: Partial<Record<string, number>>
): RerankingStrategy[] {
  const strategies = [...DEFAULT_STRATEGIES];

  // Domain-specific adjustments
  if (domain === 'ecommerce') {
    // Prefer product info and pricing
    strategies.push({
      name: 'ecommerce',
      weight: 0.25,
      scorer: (result) => {
        const contentLower = result.content.toLowerCase();
        const pricingTerms = ['prijs', 'price', 'kost', 'cost', '€', '$', 'euro'];
        const hasPrice = pricingTerms.some(term => contentLower.includes(term));
        return hasPrice ? 1.0 : 0.5;
      },
    });
  } else if (domain === 'support') {
    // Prefer FAQs and troubleshooting guides
    strategies.forEach(s => {
      if (s.name === 'sourceType') {
        s.weight = 0.35; // Increase FAQ preference
      }
    });
  } else if (domain === 'documentation') {
    // Prefer detailed, technical content
    strategies.forEach(s => {
      if (s.name === 'contentLength') {
        s.weight = 0.25; // Prefer longer content
      }
    });
  }

  // Apply custom weights if provided
  if (customWeights) {
    strategies.forEach(s => {
      if (s.name in customWeights) {
        s.weight = customWeights[s.name]!;
      }
    });
  }

  return strategies;
}

/**
 * Get re-ranking explanation for debugging
 */
export function explainReranking(
  result: SearchResult,
  context: RerankingContext,
  strategies: RerankingStrategy[] = DEFAULT_STRATEGIES
): Record<string, number> {
  const scores: Record<string, number> = {
    original: result.score,
  };

  strategies.forEach(strategy => {
    scores[strategy.name] = strategy.scorer(result, context);
  });

  return scores;
}
