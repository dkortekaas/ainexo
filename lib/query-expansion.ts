/**
 * Advanced Query Expansion for improved search recall
 * Uses AI to intelligently expand queries with synonyms, related terms, and reformulations
 */

import { openai } from "./openai";
import crypto from "crypto";

// Cache for expanded queries to avoid redundant API calls
const expansionCache = new Map<string, {
  expanded: string[];
  timestamp: number;
}>();

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Enhanced synonym database with domain-specific terms
 */
export const ENHANCED_SYNONYMS: Record<string, string[]> = {
  // Pricing & Financials
  prijs: ["kosten", "tarief", "prijzen", "betaling", "bedrag", "geld", "tarievenlijst", "kostenplaatje"],
  betalen: ["betaling", "factuur", "rekening", "kosten", "afrekenen", "voldoen", "incasseren"],
  korting: ["discount", "aanbieding", "actie", "voordeel", "reductie", "sale", "promotie"],
  gratis: ["free", "kosteloos", "zonder kosten", "voor niets", "om niet"],

  // Technical
  werkt: ["functioneert", "werking", "functionaliteit", "gebruik", "draait", "loopt", "opereert"],
  integratie: ["koppeling", "verbinding", "samenwerking", "connectie", "interface", "plugin", "add-on"],
  installatie: ["installeren", "setup", "configuratie", "instellen", "implementatie", "deployment"],
  synchronisatie: ["sync", "synchroniseren", "updaten", "verversen", "bijwerken"],

  // Support & Service
  contact: ["bereikbaar", "telefoon", "email", "adres", "contactpersoon", "bereikbaarheid", "klantenservice"],
  ondersteuning: ["support", "hulp", "assistentie", "service", "helpdesk", "klantenservice", "customer service"],
  probleem: ["issue", "error", "fout", "storing", "bug", "defect", "incident"],
  vraag: ["question", "vragen", "informatie", "uitleg", "toelichting"],

  // Account & Access
  account: ["gebruiker", "profiel", "inloggen", "registreren", "aanmelden", "user"],
  wachtwoord: ["password", "pass", "login", "credentials", "authenticatie", "inloggegevens"],
  toegang: ["access", "rechten", "permissies", "autorisatie", "privileges"],

  // Time & Availability
  openingstijden: ["open", "uren", "tijd", "geopend", "beschikbaarheid", "kantooruren", "werktijden"],
  wanneer: ["when", "tijd", "moment", "planning", "schema", "tijdstip"],
  beschikbaar: ["available", "voorradig", "verkrijgbaar", "leverbaar", "in stock"],

  // Products & Services
  product: ["producten", "artikel", "artikelen", "item", "goods", "dienst"],
  bestelling: ["bestellen", "order", "aanvragen", "aanvraag", "reserveren", "kopen"],
  levering: ["leverancier", "verzending", "leveren", "transport", "shipping", "delivery"],
  voorraad: ["stock", "inventaris", "beschikbaar", "op voorraad", "inventory"],

  // General
  informatie: ["info", "gegevens", "data", "details", "toelichting", "uitleg"],
  website: ["site", "webpagina", "portal", "platform", "online"],
  document: ["bestand", "file", "pdf", "documentatie", "handleiding"],
  download: ["downloaden", "bestand", "software", "app", "application"],
};

/**
 * AI-powered query expansion using GPT
 * Generates semantically related search terms
 */
export async function expandQueryWithAI(
  query: string,
  options: {
    maxExpansions?: number;
    language?: string;
    domain?: string;
  } = {}
): Promise<string[]> {
  const { maxExpansions = 5, language = 'nl', domain = 'general' } = options;

  // Check cache first
  const cacheKey = crypto.createHash('md5').update(`${query}:${language}:${domain}`).digest('hex');
  const cached = expansionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached query expansions');
    return cached.expanded;
  }

  if (!openai) {
    console.warn('⚠️  OpenAI not available for query expansion');
    return [query];
  }

  try {
    const prompt = `Genereer ${maxExpansions} alternatieve zoektermen voor de volgende vraag.
Deze zoektermen moeten semantisch gerelateerd zijn en helpen om relevante documenten te vinden.

Originele vraag: "${query}"
Taal: ${language}
Domein: ${domain}

Geef alleen de alternatieve zoektermen, gescheiden door newlines.
Geen uitleg, nummering of extra tekst - alleen de zoektermen.

Voorbeelden:
Input: "Hoe werkt de integratie?"
Output:
Hoe functioneert de koppeling?
Integratie uitleg
Setup en configuratie
Verbinding maken

Alternatieve zoektermen:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const expansions = response.choices[0].message.content
      ?.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 3 && !line.includes(':'))
      .slice(0, maxExpansions) || [];

    // Always include original query
    const result = [query, ...expansions];

    // Cache the result
    expansionCache.set(cacheKey, {
      expanded: result,
      timestamp: Date.now(),
    });

    console.log(`🔄 Expanded query to ${result.length} variations`);
    return result;

  } catch (error) {
    console.error('❌ Query expansion failed:', error);
    return [query];
  }
}

/**
 * Rule-based query expansion using synonym dictionary
 * Fast and deterministic, good for common terms
 */
export function expandQueryWithSynonyms(query: string): string[] {
  const queryLower = query.toLowerCase();
  const expansions = new Set<string>([query]);

  // Find matching synonyms
  Object.entries(ENHANCED_SYNONYMS).forEach(([term, synonyms]) => {
    if (queryLower.includes(term)) {
      // Add variations with synonyms
      synonyms.slice(0, 3).forEach(synonym => {
        const expanded = queryLower.replace(term, synonym);
        if (expanded !== queryLower) {
          expansions.add(expanded);
        }
      });
    }
  });

  return Array.from(expansions).slice(0, 5);
}

/**
 * Hybrid query expansion: combines rule-based + AI
 * Best of both worlds: fast + intelligent
 */
export async function expandQuery(
  query: string,
  options: {
    useAI?: boolean;
    maxExpansions?: number;
    language?: string;
    domain?: string;
  } = {}
): Promise<string[]> {
  const { useAI = true, maxExpansions = 5, language = 'nl', domain = 'general' } = options;

  // Always get rule-based expansions (fast)
  const ruleBasedExpansions = expandQueryWithSynonyms(query);

  // Optionally add AI expansions
  if (useAI && ruleBasedExpansions.length < maxExpansions) {
    const aiExpansions = await expandQueryWithAI(query, {
      maxExpansions: maxExpansions - ruleBasedExpansions.length,
      language,
      domain,
    });

    // Merge unique expansions
    const combined = [...ruleBasedExpansions];
    aiExpansions.forEach(exp => {
      if (!combined.includes(exp)) {
        combined.push(exp);
      }
    });

    return combined.slice(0, maxExpansions);
  }

  return ruleBasedExpansions.slice(0, maxExpansions);
}

/**
 * Clean expired cache entries
 */
export function cleanExpansionCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of expansionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      expansionCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired query expansion cache entries`);
  }
}

// Periodically clean cache (every 24 hours)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpansionCache, 24 * 60 * 60 * 1000);
}
