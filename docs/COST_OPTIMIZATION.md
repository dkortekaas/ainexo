# 💰 Cost Optimization Guide - AI Chat

Dit document beschrijft alle geïmplementeerde kostenoptimalisaties voor document upload, embeddings en search operaties.

## 📊 Kostenoverzicht

### Embedding Kosten (OpenAI)

| Model | Kosten per 1K tokens | Relatief |
|-------|---------------------|----------|
| `text-embedding-ada-002` | $0.0001 | 5x duurder ⚠️ |
| **`text-embedding-3-small`** | **$0.00002** | **Beste keuze ✅** |
| `text-embedding-3-large` | $0.00013 | 6.5x duurder |

**We gebruiken nu `text-embedding-3-small` = 5x goedkoper dan het oude model!**

### Geschatte Kosten per Document

Voorbeeld: 10-page PDF document (~5000 woorden, ~20KB text)

**Oude Methode:**
- Chunks: ~25 chunks (1000 chars, 200 overlap)
- Tokens: ~1250 tokens per chunk × 25 = 31,250 tokens
- Model: ada-002 ($0.0001 per 1K)
- **Kosten: $0.003125** 💸

**Nieuwe Geoptimaliseerde Methode:**
- Chunks: ~13 chunks (1500 chars, 100 overlap) = **48% minder**
- Tokens: ~1875 tokens per chunk × 13 = 24,375 tokens
- Deduplicatie: ~10% reductie = 21,938 tokens
- Model: 3-small ($0.00002 per 1K)
- **Kosten: $0.000439** 💰
- **Besparing: 86% ($0.002686)**

## 🚀 Geïmplementeerde Optimalisaties

### 1. **Goedkoper Embedding Model** (5x besparing)

```typescript
// Oud (DUUR)
const EMBEDDING_MODEL = "text-embedding-ada-002"; // $0.0001 per 1K
// Nieuw (GOEDKOOP)
const EMBEDDING_MODEL = "text-embedding-3-small"; // $0.00002 per 1K
```

**Besparing: 80% op embedding kosten**

### 2. **Content Deduplicatie** (10-30% besparing)

Detecteert identieke chunks en hergebruikt embeddings:

```typescript
//Voorbeeld:
const chunks = [
  "Same content here",
  "Unique content",
  "Same content here",  // Duplicate! Reuse embedding
];

// Result:
// - Only 2 API calls instead of 3
// - 33% cost reduction for this batch
```

**Functionaliteit:**
- SHA-256 hash van content
- In-memory cache (24 uur TTL)
- Automatische reuse bij duplicates

**Besparing: 10-30% afhankelijk van duplicate content**

### 3. **Query Embedding Cache** (50-80% besparing)

Frequently asked questions hergebruiken embedding:

```typescript
// Eerste keer: "Wat zijn de prijzen?" → API call ($0.000005)
// Tweede keer: "Wat zijn de prijzen?" → Cache HIT ($0)
// Besparing: 100% voor herhaalde queries
```

**Cache strategie:**
- Exact match op query text
- 24 uur TTL
- In-memory (production: Redis)

**Besparing: 50-80% voor veel voorkomende vragen**

### 4. **Geoptimaliseerde Chunking** (30-50% besparing)

**Oude strategie:**
- Chunk size: 1000 chars
- Overlap: 200 chars (20%)
- Min size: geen
- Result: Veel kleine chunks

**Nieuwe strategie:**
- Chunk size: 1500 chars (**50% groter**)
- Overlap: 100 chars (**50% minder**)
- Min size: 200 chars (filter tiny chunks)
- Smart boundaries: paragraph > sentence > word

**Impact:**
```
Example: 20KB document
Old: 25 chunks → 25 API calls
New: 13 chunks → 13 API calls
Reduction: 48% fewer chunks = 48% cost savings
```

**Besparing: 30-50% minder chunks**

### 5. **Batch Processing** (efficiëntie)

Combineert multiple chunks in 1 API call:

```typescript
// Old: 10 separate API calls
for (const chunk of chunks) {
  await generateEmbedding(chunk); // 10 calls
}

// New: 1 batch API call
await generateBatchEmbeddings(chunks); // 1 call
```

**Voordelen:**
- Sneller (parallel processing)
- Minder network overhead
- Betere rate limit usage

## 💡 Totale Kostenreductie

### Per Document Upload

| Aspect | Oude Methode | Nieuwe Methode | Besparing |
|--------|--------------|----------------|-----------|
| Model | ada-002 | 3-small | **80%** |
| Chunks | 25 | 13 | **48%** |
| Duplicates | Niet gedetecteerd | 10% reuse | **10%** |
| **Totaal** | **$0.003125** | **$0.000439** | **86%** 🎉 |

### Per 1000 Searches

Aanname: 50% queries zijn herhaald

| Aspect | Oude Methode | Nieuwe Methode | Besparing |
|--------|--------------|----------------|-----------|
| Model | ada-002 | 3-small | **80%** |
| Cache hits | 0% | 50% | **50%** |
| **Kosten per search** | **$0.000025** | **$0.00000250** | **90%** |
| **Kosten voor 1000** | **$0.025** | **$0.0025** | **$0.0225** 🎉 |

### Maandelijkse Besparing (Voorbeeld)

Geschatte usage:
- 100 documents uploaded per maand
- 10,000 searches per maand

**Oude kosten:**
- Documents: 100 × $0.003125 = $0.3125
- Searches: 10,000 × $0.000025 = $0.25
- **Totaal: $0.5625/maand**

**Nieuwe kosten:**
- Documents: 100 × $0.000439 = $0.0439
- Searches: 10,000 × $0.00000250 = $0.025
- **Totaal: $0.0689/maand**

**Maandelijkse besparing: $0.4936 (88%)**
**Jaarlijkse besparing: $5.92**

Voor grotere volumes (1000 docs + 100K searches):
- Oude kosten: ~$5.63/maand
- Nieuwe kosten: ~$0.69/maand
- **Besparing: ~$4.94/maand = $59/jaar**

## 🔧 Implementatie

### Gebruik de Geoptimaliseerde Services

```typescript
// Import de nieuwe optimized service
import {
  generateEmbedding,
  generateBatchEmbeddings,
  embedDocumentChunks,
} from "@/lib/embedding-service-optimized";

// Upload document met optimalisaties
const result = await embedDocumentChunks(documentId);
console.log(`Kosten: $${result.cost.toFixed(6)}`);
console.log(`Besparingen: $${result.savings.toFixed(6)}`);

// Search met query caching
const queryEmbedding = await generateEmbedding(userQuery, 'query');
// Tweede keer: komt uit cache! $0 kosten
```

### Gebruik Geoptimaliseerde Chunking

```typescript
import { chunkTextOptimized } from "@/lib/chunking-optimized";

// Oude manier (DUUR)
const chunks = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 });

// Nieuwe manier (GOEDKOOP)
const chunks = chunkTextOptimized(text, {
  chunkSize: 1500,    // Groter
  chunkOverlap: 100,  // Kleiner
  minChunkSize: 200,  // Filter tiny chunks
});

// Vergelijk strategieën
const comparison = compareChunkingStrategies(text);
console.log(`Besparing: ${comparison.costReduction}%`);
```

## 📈 Monitoring

### Cache Statistics

```typescript
import { getEmbeddingCacheStats } from "@/lib/embedding-service-optimized";

const stats = getEmbeddingCacheStats();
console.log('Query cache:', stats.queryCache.size, 'entries');
console.log('Content cache:', stats.contentHashCache.size, 'entries');
```

### Cost Tracking

Alle embedding operaties loggen nu automatisch:

```
💰 Embedding Complete:
   Processed: 25 chunks
   API calls: 13
   Saved: 12 calls (48%)
   Estimated cost: $0.000260
   Estimated savings: $0.000240
```

## ⚙️ Configuration

### Environment Variables

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Optional: Force specific model
EMBEDDING_MODEL=text-embedding-3-small

# Optional: Cache settings (production)
REDIS_URL=redis://...
EMBEDDING_CACHE_TTL=86400  # 24 hours
```

### Aanpassen Cache TTL

```typescript
// In embedding-optimization.ts
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Voor production met Redis:
// const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
```

## 🎯 Best Practices

### 1. Document Upload
- ✅ Gebruik `embedDocumentChunks()` voor batch processing
- ✅ Upload meerdere documents tegelijk
- ✅ Vermijd duplicate uploads

### 2. Search Queries
- ✅ Gebruik `generateEmbedding(query, 'query')` voor caching
- ✅ Normaliseer queries (lowercase, trim)
- ✅ Pre-cache frequent questions

### 3. Projects
- ✅ Groepeer gerelateerde documents in Projects
- ✅ Gebruik session-level caching (al geïmplementeerd)
- ✅ Refresh cache alleen bij document changes

## 🚨 Troubleshooting

### Cache Miss Rate Te Hoog

```typescript
// Check cache stats
const stats = getEmbeddingCacheStats();
console.log('Cache hit rate:', stats.queryCache.size);

// Possible causes:
// - Queries are too unique (add query normalization)
// - Cache TTL too short (increase TTL)
// - Cache cleared too often (check logs)
```

### Embeddings Falen

De service heeft automatische fallbacks:

1. `text-embedding-3-small` (goedkoopst)
2. `text-embedding-ada-002` (fallback)
3. `text-embedding-3-large` (laatste optie)
4. Empty embeddings (fallback voor search zonder semantic matching)

## 📚 Gerelateerde Documenten

- [Project System Documentation](./PROJECT_SYSTEM.md)
- [2FA System Documentation](./2FA_SYSTEM.md)
- [OpenAI Embedding Docs](https://platform.openai.com/docs/guides/embeddings)

## 🎉 Samenvatting

**Totale kostenreductie: 80-90%**

| Optimalisatie | Impact |
|---------------|--------|
| Goedkoper model (3-small) | 80% besparing |
| Deduplicatie | 10-30% besparing |
| Query caching | 50-80% besparing |
| Optimale chunking | 30-50% besparing |
| Batch processing | Efficiency gain |

**Result: Van $0.56/maand naar $0.07/maand voor typical usage.**

---

Voor vragen of suggesties, zie de codebase documentatie of open een issue.
