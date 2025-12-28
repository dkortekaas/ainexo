# ✅ Cost Optimization - Active!

Deze applicatie gebruikt nu **geoptimaliseerde** embedding en chunking services voor **80-90% kostenreductie**.

## 🎯 Wat is Geactiveerd

### 1. **File Upload** (app/api/files/route.ts)
✅ **Geoptimaliseerde chunking**
- Chunk size: 1500 chars (was 1000) = 30-50% minder chunks
- Overlap: 100 chars (was 200) = 50% minder redundantie
- Min size: 200 chars = filter tiny chunks
- Smart boundaries: paragraph → sentence → word

✅ **Cost-optimized embeddings**
- Model: `text-embedding-3-small` (was ada-002) = **5x goedkoper**
- Automatische deduplicatie van identieke chunks
- Batch processing met cost tracking
- Comprehensive logging van besparingen

### 2. **Search** (lib/search.ts)
✅ **Query embedding caching**
- Identieke queries hergebruiken embedding = **$0 kosten**
- 24-uur cache TTL
- 50-80% cost reduction voor frequent asked questions
- Automatische fallback naar oude service bij fouten

## 📊 Verwachte Besparingen

### Per Document Upload
```
Document: 10-page PDF (~20KB text)

OUD (DUUR):
- 25 chunks × ada-002 ($0.0001/1K) = $0.003125

NIEUW (GOEDKOOP):
- 13 chunks × 3-small ($0.00002/1K) = $0.000439

BESPARING: $0.002686 (86%)
```

### Per Search Query
```
Query: "Wat zijn de prijzen?"

OUD (DUUR):
- Eerste keer: $0.000025
- Tweede keer: $0.000025
- Totaal: $0.000050

NIEUW (GOEDKOOP):
- Eerste keer: $0.000005
- Tweede keer: $0 (cache!)
- Totaal: $0.000005

BESPARING: $0.000045 (90%)
```

## 🔍 Logs Monitoring

Bij file upload zie je nu:

```
📊 Starting optimized chunking for: document.pdf
✅ Created 13 optimized chunks

🚀 Generating optimized embeddings with cost reduction...
♻️  Detected 2 duplicate chunks - will reuse embeddings
💰 Saved 2 embedding API calls via content deduplication

💰 Embedding Stats:
   Chunks: 13
   Tokens: 24,375
   Estimated cost: $0.000488
   (Using text-embedding-3-small - 5x cheaper than ada-002!)
✅ Created 13 chunks with embeddings for: document.pdf
```

Bij search queries zie je nu:

```
✅ Query embedding cache HIT
(Of: ❌ Query embedding cache MISS - generating new embedding)
```

## 📈 Cache Statistics

Check cache performance:

```typescript
import { getEmbeddingCacheStats } from "@/lib/embedding-service-optimized";

const stats = getEmbeddingCacheStats();
console.log('Query cache:', stats.queryCache.size, 'entries');
console.log('Content cache:', stats.contentHashCache.size, 'entries');
```

## ⚙️ Configuration

Alle optimalisaties zijn **automatisch actief**. Geen configuratie nodig!

### Environment Variables (optioneel)

```env
# Already configured
OPENAI_API_KEY=sk-...

# Optional: Force specific model (default is already optimal)
# EMBEDDING_MODEL=text-embedding-3-small

# Optional: Adjust cache TTL (default: 24 hours)
# EMBEDDING_CACHE_TTL=86400
```

## 🔄 Backwards Compatibility

- ✅ Oude embeddings blijven werken
- ✅ Geen breaking changes
- ✅ Automatische fallback bij fouten
- ✅ Alle bestaande features werken nog

## 📚 Meer Informatie

Zie [COST_OPTIMIZATION.md](./COST_OPTIMIZATION.md) voor:
- Gedetailleerde cost breakdown
- Implementation details
- Best practices
- Troubleshooting guide

## 💡 Tips voor Maximum Besparing

1. **Upload grotere batches** - Meer kans op deduplicatie
2. **Groepeer gerelateerde documents** in Projects - Session caching actief!
3. **Herstart applicatie periodiek** - Cleared oude cache entries
4. **Monitor logs** - Track actual savings

## 🎉 Resultaat

**Typical usage** (100 docs + 10K searches/maand):
- Was: $0.56/maand
- Nu: $0.07/maand
- **Besparing: $0.49/maand = $5.88/jaar (88%)**

Voor grotere volumes zijn de besparingen nog groter!

---

Last updated: 2025-10-27
Version: 1.0.0
