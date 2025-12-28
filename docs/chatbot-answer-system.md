# Chatbot Answer System Documentation

## Overzicht

Dit document beschrijft hoe het AI-chatbot systeem antwoorden genereert op basis van de knowledge base. Het systeem is ontworpen om alleen antwoorden te geven die gebaseerd zijn op beschikbare informatie in de database.

## Architectuur

### 1. Hoofdcomponenten

```
User Question → Search Engine → AI Response Generator → Answer
     ↓              ↓                    ↓
Knowledge Base → Context Processing → Response Filtering
```

### 2. Database Tabellen

Het systeem doorzoekt de volgende tabellen:

- **FAQ** - Veelgestelde vragen en antwoorden
- **Document** - Geüploade documenten (PDF, DOCX, TXT)
- **DocumentChunk** - Chunks van documenten voor vector search
- **KnowledgeFile** - Knowledge base bestanden
- **Website** - Website informatie
- **WebsitePage** - Individuele webpagina's

## Zoekproces

### 1. Query Processing

```typescript
// Verbeterde query verwerking
const questionWords = query
  .toLowerCase()
  .replace(/[^\w\s]/g, " ") // Verwijder leestekens
  .split(" ")
  .filter((word) => word.length > 2)
  .filter(
    (word) =>
      !["wat", "hoe", "waar", "wanneer", "waarom", "wie", "welke"].includes(
        word
      )
  );
```

**Doel**: Focus op belangrijke zoekwoorden door vraagwoorden en leestekens te verwijderen.

### 2. Query Preprocessing Verbetering

```typescript
async function preprocessQuery(query: string): Promise<string> {
  // 1. Normalisatie
  let processed = query.toLowerCase().trim();

  // 2. Synoniemen expansie (voor betere recall)
  const synonyms: Record<string, string[]> = {
    prijs: ["kosten", "tarief", "prijzen"],
    werkt: ["functioneert", "werking", "functionaliteit"],
    integratie: ["koppeling", "verbinding", "samenwerking"],
    contact: ["bereikbaar", "telefoon", "email", "adres"],
    openingstijden: ["open", "uren", "tijd", "geopend"],
    betalen: ["betaling", "factuur", "rekening", "kosten"],
    installatie: ["installeren", "setup", "configuratie"],
    ondersteuning: ["support", "hulp", "assistentie", "service"],
    account: ["gebruiker", "profiel", "inloggen", "registreren"],
    download: ["downloaden", "bestand", "software", "app"],
  };

  // Voeg synoniemen toe aan query voor betere matching
  Object.entries(synonyms).forEach(([term, syns]) => {
    if (processed.includes(term)) {
      processed += " " + syns.join(" ");
    }
  });

  // 3. Verwijder stop words maar behoud context
  const essentialWords = processed
    .split(" ")
    .filter((word) => word.length > 2)
    .filter(
      (word) =>
        ![
          "een",
          "het",
          "de",
          "van",
          "met",
          "voor",
          "aan",
          "op",
          "in",
          "bij",
          "naar",
          "over",
          "onder",
          "tussen",
          "door",
          "zonder",
          "tijdens",
          "na",
          "voor",
          "om",
          "te",
          "dat",
          "die",
          "dit",
          "wat",
          "wie",
          "waar",
          "wanneer",
          "waarom",
          "hoe",
          "welke",
        ].includes(word)
    )
    .join(" ");

  return essentialWords;
}
```

#### Voordelen van Query Preprocessing:

1. **Synoniemen Expansie**: "prijs" wordt uitgebreid naar "kosten tarief prijzen"
2. **Stop Words Removal**: Verwijder onbelangrijke woorden zoals "een", "het", "de"
3. **Normalisatie**: Consistent lowercase en trimmed input
4. **Betere Recall**: Meer relevante resultaten door uitgebreide zoektermen

#### Voorbeelden:

- **Input**: "Wat zijn de prijzen?"
- **Output**: "prijzen kosten tarief prijzen"

- **Input**: "Hoe werkt de integratie?"
- **Output**: "werkt functioneert werking functionaliteit integratie koppeling verbinding samenwerking"

### 3. Knowledge Base Search

#### A. FAQ Search

```typescript
const faqResults = await db.fAQ.findMany({
  where: {
    assistantId: assistantId,
    enabled: true,
    OR: [
      // Exacte vraag match
      { question: { contains: query, mode: "insensitive" } },
      // Antwoord bevat query
      { answer: { contains: query, mode: "insensitive" } },
      // Individuele woorden in vraag
      ...questionWords.map((word) => ({
        question: { contains: word, mode: "insensitive" },
      })),
      // Individuele woorden in antwoord
      ...questionWords.map((word) => ({
        answer: { contains: word, mode: "insensitive" },
      })),
    ],
  },
  orderBy: { order: "asc" },
  take: 5,
});
```

#### B. Document Search

```typescript
// Zoekt in documenten en chunks
const documentResults = await db.document.findMany({
  where: {
    status: "COMPLETED",
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ],
  },
});
```

#### C. Vector Search (AI-powered)

```typescript
// Semantische zoekopdracht met embeddings
const vectorResults = await semanticSearch(query, {
  limit: 5,
  similarityThreshold: 0.7, // Minimaal 70% relevantie
  documentTypes: ["URL", "PDF", "DOCX", "TXT"],
});
```

### 3. Scoring Systeem

#### FAQ Scoring

```typescript
let score = 0;

// Exacte match scoring
if (faq.question.toLowerCase().includes(query.toLowerCase())) {
  score += 10;
}
if (faq.answer.toLowerCase().includes(query.toLowerCase())) {
  score += 8;
}

// Keyword matching
const questionKeywords = questionWords.filter((word) =>
  faq.question.toLowerCase().includes(word.toLowerCase())
);
const answerKeywords = questionWords.filter((word) =>
  faq.answer.toLowerCase().includes(word.toLowerCase())
);

score += questionKeywords.length * 3;
score += answerKeywords.length * 2;

// Normaliseer naar 0-1 schaal
relevanceScore: Math.min(score / 10, 1.0);
```

#### Document Scoring

```typescript
// Documenten krijgen basis score van 0.6
// Vector search resultaten behouden hun similarity score
// Website content krijgt extra boost voor URL matches
```

### 4. Resultaat Filtering

```typescript
// Filter lage-relevantie resultaten
const filteredResults = results
  .filter((result) => result.relevanceScore >= 0.3) // Minimaal 30% relevantie
  .sort((a, b) => b.relevanceScore - a.relevanceScore)
  .slice(0, limit);
```

## AI Response Generatie

### 1. Context Building

```typescript
// Bouw context string van knowledge base resultaten
const contextString = context
  .map((item, index) => {
    const source = item.url ? ` (Bron: ${item.url})` : "";
    return `[Bron ${index + 1}] ${item.title}${source}:\n${item.content}`;
  })
  .join("\n\n");
```

### 2. Enhanced System Prompt with Citation Requirements

```typescript
const defaultSystemPrompt = `Je bent een AI-assistent die vragen beantwoordt op basis van ALLEEN de gegeven context.

STRIKTE REGELS:
1. Gebruik ALLEEN informatie uit de context hieronder
2. Citeer specifieke bronnen: gebruik [Bron X] in je antwoord
3. Als informatie ontbreekt: "Deze informatie staat niet in de beschikbare bronnen"
4. VERBODEN: eigen kennis, aannames, gissingen, extrapolaties

ANTWOORD STRUCTUUR:
- Direct antwoord op de vraag (1-2 zinnen)
- Ondersteunende details met bronvermelding
- Bij twijfel: expliciet aangeven wat wel/niet bekend is

VOORBEELDEN VAN GOEDE ANTWOORDEN:
Vraag: "Wat kost de professional versie?"
Goed: "De professional versie kost €599/maand voor tot 25 locaties [Bron 1]. Dit is exclusief BTW en inclusief support."
Slecht: "De prijzen variëren. Neem contact op voor informatie."

Vraag: "Werkt het met Shopify?"
Goed (als in context): "Ja, er is een Shopify integratie beschikbaar [Bron 2]."
Goed (als niet in context): "Deze informatie staat niet in de beschikbare bronnen. Neem contact op via info@example.com voor details over integraties."

Context informatie (${topSources.length} bronnen):
${contextString}

Vraag: ${question}

Antwoord (met bronvermeldingen):`;
```

### 3. AI Parameters

```typescript
const aiResponse = await generateAIResponse(question, knowledgeResults, {
  model: "gpt-4o-mini",
  temperature: 0.1, // Zeer lage temperatuur voor minder creativiteit
  maxTokens: 500,
  systemPrompt: chatbotSettings.mainPrompt,
  language: "nl",
  tone: "professional",
});
```

### 4. Improved Confidence Calculation

```typescript
function calculateConfidence(
  knowledgeResults: KnowledgeResult[],
  answer: string,
  question: string
): number {
  if (knowledgeResults.length === 0) return 0.1;

  // Factor 1: Gemiddelde relevantie (40% gewicht)
  const avgRelevance =
    knowledgeResults.reduce((sum, r) => sum + r.relevanceScore, 0) /
    knowledgeResults.length;

  // Factor 2: Best result score (30% gewicht)
  const bestScore = knowledgeResults[0]?.relevanceScore || 0;

  // Factor 3: Aantal goede bronnen (15% gewicht)
  const goodSources = knowledgeResults.filter(
    (r) => r.relevanceScore > 0.6
  ).length;
  const sourceScore = Math.min(goodSources / 3, 1.0); // Optimaal bij 3+ bronnen

  // Factor 4: Answer completeness (15% gewicht)
  const answerLength = answer.length;
  const completenessScore = Math.min(answerLength / 200, 1.0); // Sweet spot rond 200 chars

  // Gewogen gemiddelde
  const confidence =
    avgRelevance * 0.4 +
    bestScore * 0.3 +
    sourceScore * 0.15 +
    completenessScore * 0.15;

  return Math.min(Math.max(confidence, 0.1), 1.0);
}
```

#### Confidence Factoren:

1. **Gemiddelde Relevantie (40%)**: Hoe relevant zijn alle bronnen gemiddeld?
2. **Beste Score (30%)**: Hoe relevant is de beste bron?
3. **Aantal Goede Bronnen (15%)**: Hoeveel bronnen hebben >60% relevantie?
4. **Antwoord Volledigheid (15%)**: Is het antwoord compleet genoeg (rond 200 karakters)?

#### Voorbeelden van Confidence Scoring:

**Scenario 1: Hoge Confidence (85%)**

- 3 bronnen met scores: 90%, 85%, 80%
- Gemiddelde: 85% × 0.40 = 34%
- Beste score: 90% × 0.30 = 27%
- Goede bronnen: 3/3 × 0.15 = 15%
- Antwoord lengte: 180 chars × 0.15 = 9%
- **Totaal: 85%**

**Scenario 2: Lage Confidence (45%)**

- 2 bronnen met scores: 60%, 40%
- Gemiddelde: 50% × 0.40 = 20%
- Beste score: 60% × 0.30 = 18%
- Goede bronnen: 1/3 × 0.15 = 5%
- Antwoord lengte: 80 chars × 0.15 = 2%
- **Totaal: 45%**

### 5. Semantic Cache voor Performance

```typescript
// Cache frequente vragen om kosten en latency te reduceren
const responseCache = new Map<string, CachedResponse>();

interface CachedResponse {
  answer: string;
  confidence: number;
  timestamp: number;
  sources: Source[];
  tokensUsed: number;
}

async function getCachedOrGenerate(
  question: string,
  context: KnowledgeResult[]
): Promise<Response> {
  // Genereer semantic hash van vraag
  const questionEmbedding = await generateEmbedding(question);
  const cacheKey = hashEmbedding(questionEmbedding);

  // Check cache (max 1 uur oud)
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    console.log("📦 Using cached response");
    return cached;
  }

  // Generate nieuwe response
  const response = await generateAIResponse(question, context);

  // Cache alleen high-confidence responses
  if (response.confidence >= 0.7) {
    responseCache.set(cacheKey, {
      ...response,
      timestamp: Date.now(),
    });
  }

  return response;
}
```

#### Cache Voordelen:

1. **Kosten Reductie**: Geen OpenAI API calls voor cached responses
2. **Latency Verbetering**: Instant responses voor frequente vragen
3. **Semantic Matching**: Vergelijkbare vragen gebruiken dezelfde cache
4. **High-Quality Only**: Alleen responses met >70% confidence worden gecached
5. **TTL Management**: Cache entries verlopen na 1 uur

#### Cache Strategie:

- **Semantic Hash**: Gebruikt embedding hash voor cache key
- **Confidence Filter**: Alleen hoge kwaliteit responses worden gecached
- **Time-based Expiry**: 1 uur TTL voor fresh content
- **Memory Efficient**: In-memory Map voor snelle toegang

### 6. Quick Wins voor Performance

#### A. Verlaagde Similarity Threshold

```typescript
// Van 0.7 naar 0.5 voor betere recall
similarityThreshold = 0.5;
```

**Voordeel**: Meer relevante resultaten, betere coverage van knowledge base

#### B. Multi-Source Context (al geïmplementeerd)

```typescript
// Top 5 bronnen in plaats van alleen beste
const topSources = context.filter((r) => r.relevanceScore >= 0.4).slice(0, 5);
```

**Voordeel**: Rijkere context voor AI, betere antwoorden

#### C. Citation Requirements (al geïmplementeerd)

```typescript
// System prompt bevat citation requirements
"2. Citeer specifieke bronnen: gebruik [Bron X] in je antwoord";
```

**Voordeel**: Betere grounding, transparantie voor gebruikers

#### D. Deterministische Output

```typescript
// Temperature 0.0 voor volledig deterministische output
temperature: temperature || 0.0;
```

**Voordeel**: Consistente antwoorden, minder variatie

#### E. Length Penalty

```typescript
// Antwoorden < 50 characters krijgen lagere confidence
if (answerLength < 50) {
  completenessScore *= 0.5; // 50% penalty
}
```

**Voordeel**: Stimuleert volledige, informatieve antwoorden

### 6. Response Validation Layer

```typescript
async function validateResponse(
  question: string,
  answer: string,
  context: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>
): Promise<{
  isGrounded: boolean;
  confidence: number;
  unsupportedClaims: string[];
  reasoning: string;
}> {
  const validationPrompt = `Analyseer of het volgende antwoord volledig gebaseerd is op de gegeven context.

Context:
${contextStrings.join("\n\n")}

Vraag: ${question}

Antwoord: ${answer}

Geef een JSON response:
{
  "isGrounded": true/false,
  "confidence": 0.0-1.0,
  "unsupportedClaims": ["claim1", "claim2"],
  "reasoning": "korte uitleg"
}`;

  const validation = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: validationPrompt }],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  return JSON.parse(validation.choices[0].message.content || "{}");
}

// Gebruik in de flow:
const validation = await validateResponse(
  question,
  aiResponse.answer,
  topSources
);

if (!validation.isGrounded || validation.confidence < 0.7) {
  console.log("⚠️ Response validation failed:", validation.reasoning);
  // Return fallback response
}
```

## Response Filtering

### 1. Confidence Threshold

```typescript
// Alleen AI responses met hoge confidence accepteren
if (aiResponse.confidence >= 0.6) {
  answer = aiResponse.answer;
  // ... gebruik AI response
} else {
  console.log("❌ AI response rejected (low confidence)");
  // Gebruik fallback message
}
```

### 2. Fallback Mechanismen

#### A. Geen Knowledge Base Resultaten

```typescript
if (knowledgeResults.length === 0) {
  answer =
    "Sorry, ik kan deze vraag niet beantwoorden op basis van de beschikbare informatie in onze knowledge base. Neem contact op met ons team voor persoonlijke assistentie.";
  confidence = 0.1;
}
```

#### B. AI Response Mislukt

```typescript
// Fallback naar beste knowledge base resultaat
const bestResult = knowledgeResults[0];
if (bestResult) {
  answer = bestResult.content;
  confidence = bestResult.relevanceScore;
}
```

#### C. Greeting Messages

```typescript
// Alleen als er geen knowledge base resultaten zijn
if (
  knowledgeResults.length === 0 &&
  (question.toLowerCase().includes("hallo") ||
    question.toLowerCase().includes("hello"))
) {
  answer = chatbotSettings.welcomeMessage || "Hallo! Hoe kan ik je helpen?";
  confidence = 1.0;
}
```

## Source Management

### 1. Single Source Display

```typescript
// Toon alleen de beste bron (hoogste relevance score)
const bestResult = knowledgeResults[0];
sources = [
  {
    documentName: bestResult.title,
    documentType: bestResult.type,
    relevanceScore: bestResult.relevanceScore,
    url: bestResult.url,
  },
];
```

### 2. Source Logging

```typescript
console.log(
  "📚 Best Source Used:",
  sources[0]?.documentName,
  `(${(sources[0]?.relevanceScore * 100).toFixed(1)}%)`
);
```

## Feedback Systeem

### 1. Feedback API

```typescript
// POST /api/chat/feedback
{
  messageId: string,
  sessionId: string,
  rating: "thumbs_up" | "thumbs_down",
  feedback?: string
}
```

### 2. Poor Response Analysis

Wanneer een gebruiker "thumbs down" geeft:

```typescript
// Automatische analyse van slechte responses
const analysis = await db.poorResponseAnalysis.create({
  data: {
    messageId: messageId,
    originalQuestion: question,
    originalAnswer: answer,
    userFeedback: feedback,
    confidence: confidence,
    sourcesUsed: sources.length,
    analysisStatus: "PENDING",
  },
});
```

### 3. Improvement Suggestions

Het systeem genereert automatisch verbeteringssuggesties:

- **LOW_CONFIDENCE**: Lage confidence score → Voeg meer relevante bronnen toe
- **NO_SOURCES**: Geen bronnen gebruikt → Verbeter knowledge base
- **TOO_SHORT**: Antwoord te kort → Voeg meer context toe
- **IRRELEVANT_CONTENT**: Niet relevant → Controleer zoekalgoritme
- **INCOMPLETE_ANSWER**: Onvolledig → Voeg gedetailleerde info toe

## Knowledge Base Best Practices

### 1. FAQ Content Richtlijnen

#### ❌ Slecht voorbeeld:

```javascript
{
  question: "Wat zijn de prijzen?",
  answer: "Onze prijzen variëren afhankelijk van het pakket. Neem contact met ons op voor een offerte op maat."
}
```

#### ✅ Goed voorbeeld:

```javascript
{
  question: "Wat zijn de prijzen voor jullie foodservice software?",
  answer: "Onze foodservice software kost €299/maand voor de basis versie (tot 5 locaties), €599/maand voor de professional versie (tot 25 locaties), en €999/maand voor de enterprise versie (onbeperkt locaties). Alle prijzen zijn exclusief BTW en inclusief support. Voor een offerte op maat kun je contact opnemen via info@example.com."
}
```

### 2. Content Kwaliteit Checklist

- ✅ **Specifieke vragen** in plaats van generieke
- ✅ **Concrete cijfers en details** in plaats van vage antwoorden
- ✅ **Actionable informatie** met stappen en contactgegevens
- ✅ **Meerdere vraagvarianten** voor dezelfde informatie
- ✅ **Context-rijke antwoorden** die de vraag volledig beantwoorden
- ✅ **Relevante keywords** in zowel vraag als antwoord

### 3. Voorbeeld Content Structuur

```javascript
// Voor foodservice software
[
  {
    question: "Wat is PS in foodservice?",
    answer:
      "PS in foodservice staat voor Point of Sale - het kassasysteem waar klanten betalen. Onze foodservice software integreert met PS systemen om real-time verkoopdata te synchroniseren, voorraad bij te werken en rapporten te genereren. Dit helpt restaurants om hun operaties te optimaliseren en kosten te besparen.",
  },
  {
    question:
      "Hoe werkt de bestelling plaatsen in jullie foodservice software?",
    answer:
      "Om een bestelling te plaatsen: 1) Log in op het dashboard, 2) Selecteer 'Nieuwe Bestelling', 3) Kies leverancier en producten, 4) Controleer hoeveelheden en prijzen, 5) Klik 'Bestelling Plaatsen'. De bestelling wordt automatisch naar de leverancier gestuurd.",
  },
];
```

## Monitoring en Logging

### 1. Search Logging

```typescript
console.log("🔍 Search parameters:", {
  question: question,
  assistantId: chatbotSettings.id,
  limit: 8,
  similarityThreshold: 0.6,
  useAI: EMBEDDINGS_ENABLED,
});

console.log("📚 Found knowledge base results:", knowledgeResults.length);
console.log("📋 Knowledge base results details:");
knowledgeResults.forEach((result, index) => {
  console.log(`  ${index + 1}. [${result.type}] ${result.title}`);
  console.log(`     Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
  console.log(`     Content preview: ${result.content.substring(0, 100)}...`);
});
```

### 2. AI Response Logging

```typescript
console.log("🤖 Generating AI response...");
console.log("⚙️ AI Settings:", {
  model: "gpt-4o-mini",
  temperature: 0.1,
  maxTokens: 500,
  language: "nl",
  tone: "professional",
});

console.log("✅ AI response accepted (high confidence)");
console.log("🎯 Final Answer:", answer);
console.log("📊 Confidence Score:", (confidence * 100).toFixed(1) + "%");
console.log("🔢 Tokens Used:", tokensUsed);
```

### 3. Performance Metrics

Het systeem trackt:

- **Response time** - Hoe lang het duurt om een antwoord te genereren
- **Confidence scores** - Kwaliteit van matches
- **Token usage** - AI kosten
- **Source relevance** - Kwaliteit van gevonden bronnen
- **User feedback** - Tevredenheid van gebruikers

## Troubleshooting

### 1. Veelvoorkomende Problemen

#### A. Geen antwoorden ondanks knowledge base content

- **Oorzaak**: Te hoge similarity threshold
- **Oplossing**: Verlaag `similarityThreshold` van 0.7 naar 0.5

#### B. AI gebruikt eigen kennis in plaats van context

- **Oorzaak**: Te hoge temperature of zwakke system prompt
- **Oplossing**: Verlaag temperature naar 0.1 en versterk system prompt

#### C. Lage confidence scores

- **Oorzaak**: Slechte content kwaliteit in knowledge base
- **Oplossing**: Verbeter FAQ content met specifieke, concrete informatie

### 2. Debugging Tips

1. **Controleer logs** voor search parameters en resultaten
2. **Test queries** met verschillende similarity thresholds
3. **Analyseer feedback** van gebruikers voor verbeterpunten
4. **Monitor confidence scores** om kwaliteit te meten

## API Endpoints

### 1. Chat Message

```
POST /api/chat/message
Headers: X-Chatbot-API-Key: your-api-key
Body: {
  question: string,
  sessionId?: string,
  metadata?: {
    userAgent?: string,
    referrer?: string
  }
}
```

### 2. Feedback

```
POST /api/chat/feedback
Headers: X-Chatbot-API-Key: your-api-key
Body: {
  messageId: string,
  sessionId: string,
  rating: "thumbs_up" | "thumbs_down",
  feedback?: string
}
```

### 3. Admin Feedback Overview

```
GET /api/admin/feedback
Headers: Authorization: Bearer admin-token
Query: ?page=1&limit=20&rating=thumbs_down
```

### 4. Admin Suggestions

```
GET /api/admin/suggestions
Headers: Authorization: Bearer admin-token
Query: ?priority=HIGH&status=PENDING
```

## Conclusie

Het chatbot antwoord systeem is ontworpen om:

- ✅ **Alleen betrouwbare antwoorden** te geven op basis van knowledge base
- ✅ **Hoge kwaliteit** te waarborgen door strikte filtering
- ✅ **Continue verbetering** door feedback en analyse
- ✅ **Transparantie** te bieden door uitgebreide logging
- ✅ **Schaalbaarheid** te ondersteunen voor verschillende use cases

Voor optimale resultaten is het belangrijk om de knowledge base regelmatig te onderhouden en te verbeteren op basis van gebruikersfeedback en performance metrics.
