/**
 * Multi-lingual Support for AI Chat
 * Automatic language detection and optional translation
 */

import { openai } from "./openai";

export type SupportedLanguage = 'nl' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'auto';

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  isSupported: boolean;
}

export interface TranslationResult {
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
  tokensUsed: number;
}

/**
 * Fast rule-based language detection
 * Checks for common words/patterns in each language
 */
export function detectLanguageFast(text: string): LanguageDetectionResult {
  const textLower = text.toLowerCase();

  // Dutch indicators
  const dutchIndicators = ['het', 'de', 'een', 'van', 'voor', 'wat', 'hoe', 'waarom', 'wanneer', 'waar', 'jullie', 'zijn', 'hebben', 'kunnen', 'willen', 'moet', 'zou', 'als', 'dat', 'deze', 'dit'];
  const dutchCount = dutchIndicators.filter(word => new RegExp(`\\b${word}\\b`).test(textLower)).length;

  // English indicators
  const englishIndicators = ['the', 'is', 'are', 'what', 'how', 'why', 'when', 'where', 'can', 'would', 'should', 'have', 'has', 'this', 'that', 'with', 'for', 'from', 'your', 'you'];
  const englishCount = englishIndicators.filter(word => new RegExp(`\\b${word}\\b`).test(textLower)).length;

  // German indicators
  const germanIndicators = ['der', 'die', 'das', 'ist', 'sind', 'ein', 'eine', 'für', 'von', 'mit', 'wie', 'was', 'wo', 'wann', 'warum', 'ich', 'du', 'sie', 'haben', 'können'];
  const germanCount = germanIndicators.filter(word => new RegExp(`\\b${word}\\b`).test(textLower)).length;

  // French indicators
  const frenchIndicators = ['le', 'la', 'les', 'un', 'une', 'est', 'sont', 'pour', 'de', 'avec', 'comment', 'quoi', 'où', 'quand', 'pourquoi', 'je', 'tu', 'vous', 'avoir', 'être'];
  const frenchCount = frenchIndicators.filter(word => new RegExp(`\\b${word}\\b`).test(textLower)).length;

  // Spanish indicators
  const spanishIndicators = ['el', 'la', 'los', 'las', 'un', 'una', 'es', 'son', 'para', 'de', 'con', 'cómo', 'qué', 'dónde', 'cuándo', 'por qué', 'yo', 'tú', 'usted', 'tener', 'ser'];
  const spanishCount = spanishIndicators.filter(word => new RegExp(`\\b${word}\\b`).test(textLower)).length;

  // Determine language based on counts
  const counts = {
    nl: dutchCount,
    en: englishCount,
    de: germanCount,
    fr: frenchCount,
    es: spanishCount,
  };

  const maxLang = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b);
  const [language, count] = maxLang;

  // Calculate confidence based on match count
  const totalWords = text.split(/\s+/).length;
  const confidence = Math.min(count / Math.max(totalWords * 0.2, 1), 1);

  return {
    language,
    confidence,
    isSupported: ['nl', 'en', 'de', 'fr', 'es'].includes(language),
  };
}

/**
 * AI-powered language detection (more accurate but slower)
 */
export async function detectLanguageAI(text: string): Promise<LanguageDetectionResult> {
  if (!openai) {
    console.warn('⚠️  OpenAI not available, falling back to fast detection');
    return detectLanguageFast(text);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Detect the language of this text. Respond with ONLY the ISO 639-1 language code (e.g., 'nl', 'en', 'de', 'fr', 'es'):\n\n"${text}"`
      }],
      temperature: 0,
      max_tokens: 10,
    });

    const language = response.choices[0].message.content?.trim().toLowerCase() || 'en';

    return {
      language,
      confidence: 0.95,
      isSupported: ['nl', 'en', 'de', 'fr', 'es', 'it'].includes(language),
    };
  } catch (error) {
    console.error('❌ AI language detection failed:', error);
    return detectLanguageFast(text);
  }
}

/**
 * Translate text to target language
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  if (!openai) {
    throw new Error('OpenAI not available for translation');
  }

  const sourceLang = sourceLanguage || (await detectLanguageFast(text)).language;

  // No translation needed if same language
  if (sourceLang === targetLanguage) {
    return {
      translatedText: text,
      originalLanguage: sourceLang,
      targetLanguage,
      tokensUsed: 0,
    };
  }

  try {
    const languageNames: Record<string, string> = {
      nl: 'Dutch',
      en: 'English',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are a professional translator. Translate the following text from ${languageNames[sourceLang] || sourceLang} to ${languageNames[targetLanguage] || targetLanguage}. Maintain the original tone and meaning. Output ONLY the translation, no explanations.`
      }, {
        role: 'user',
        content: text
      }],
      temperature: 0.3,
      max_tokens: Math.ceil(text.length * 1.5),
    });

    const translatedText = response.choices[0].message.content || text;
    const tokensUsed = response.usage?.total_tokens || 0;

    console.log(`🌍 Translated from ${sourceLang} to ${targetLanguage} (${tokensUsed} tokens)`);

    return {
      translatedText,
      originalLanguage: sourceLang,
      targetLanguage,
      tokensUsed,
    };
  } catch (error) {
    console.error('❌ Translation failed:', error);
    return {
      translatedText: text,
      originalLanguage: sourceLang,
      targetLanguage,
      tokensUsed: 0,
    };
  }
}

/**
 * Auto-translate query and response if needed
 */
export async function handleMultilingualQuery(
  query: string,
  expectedLanguage: string = 'nl'
): Promise<{
  processedQuery: string;
  detectedLanguage: string;
  needsTranslation: boolean;
}> {
  const detection = await detectLanguageFast(query);

  console.log(`🌍 Detected language: ${detection.language} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);

  // If detected language matches expected, no translation needed
  if (detection.language === expectedLanguage || detection.confidence < 0.5) {
    return {
      processedQuery: query,
      detectedLanguage: detection.language,
      needsTranslation: false,
    };
  }

  // Translate query to expected language for better knowledge base matching
  console.log(`🔄 Translating query from ${detection.language} to ${expectedLanguage}...`);

  const translation = await translateText(query, expectedLanguage, detection.language);

  return {
    processedQuery: translation.translatedText,
    detectedLanguage: detection.language,
    needsTranslation: true,
  };
}

/**
 * Translate response back to user's language if needed
 */
export async function translateResponseIfNeeded(
  response: string,
  userLanguage: string,
  systemLanguage: string = 'nl'
): Promise<string> {
  if (userLanguage === systemLanguage) {
    return response;
  }

  console.log(`🔄 Translating response from ${systemLanguage} to ${userLanguage}...`);

  const translation = await translateText(response, userLanguage, systemLanguage);
  return translation.translatedText;
}

/**
 * Get language-specific system prompts
 */
export function getLanguageSpecificInstructions(language: string): string {
  const instructions: Record<string, string> = {
    nl: 'Antwoord in het Nederlands. Wees professioneel en duidelijk.',
    en: 'Answer in English. Be professional and clear.',
    de: 'Antworten Sie auf Deutsch. Seien Sie professionell und klar.',
    fr: 'Répondez en français. Soyez professionnel et clair.',
    es: 'Responda en español. Sea profesional y claro.',
    it: 'Rispondi in italiano. Sii professionale e chiaro.',
  };

  return instructions[language] || instructions.nl;
}
