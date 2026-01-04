# Database Migration Guide - Performance Optimizations

## Overzicht

De audit heeft 2 kritieke database migraties geïdentificeerd die de performance drastisch verbeteren:

1. **Vector Index** (CRITICAL) - 10-100x snellere semantic search
2. **Compound Indexes** (HIGH) - 2-3x snellere queries

## ⚠️ Belangrijke Opmerkingen

- Deze migraties zijn **safe** - ze voegen alleen indexes toe, geen data wijzigingen
- Index creatie kan 1-5 minuten duren afhankelijk van database grootte
- Er is **geen downtime** nodig
- Indexes verbeteren read performance, geen impact op write performance

## Optie 1: Automatisch Script (Aanbevolen)

### Stap 1: Database URL Configureren

Zorg dat je `DATABASE_URL` environment variabele is ingesteld:

```bash
# Optie A: Exporteer tijdelijk (huidige terminal sessie)
export DATABASE_URL='postgresql://user:password@host:port/database'

# Optie B: Maak een .env bestand aan
echo 'DATABASE_URL="postgresql://user:password@host:port/database"' > .env
source .env
```

### Stap 2: Run het Script

```bash
# Voer alle migraties uit
./scripts/apply-performance-migrations.sh
```

Het script zal:
- ✅ Controleren of database toegang werkt
- ✅ Vector index toevoegen (document_chunks.embedding)
- ✅ Compound indexes toevoegen (5 indexes)
- ✅ Verifiëren dat indexes succesvol zijn aangemaakt
- ✅ Index groottes tonen

## Optie 2: Handmatig via psql

Als je directe database toegang hebt:

```bash
# Verbind met database
psql "postgresql://user:password@host:port/database"

# Of als je al verbonden bent:
\i prisma/migrations/add_vector_index.sql
\i prisma/migrations/add_compound_indexes.sql
```

## Optie 3: Via Prisma CLI

Als je Prisma gebruikt:

```bash
# Vector index
npx prisma db execute \
  --file prisma/migrations/add_vector_index.sql \
  --schema prisma/schema.prisma

# Compound indexes
npx prisma db execute \
  --file prisma/migrations/add_compound_indexes.sql \
  --schema prisma/schema.prisma
```

## Optie 4: Via Database Management Tool

Als je een GUI tool gebruikt (pgAdmin, DBeaver, etc.):

1. Open `prisma/migrations/add_vector_index.sql`
2. Kopieer de SQL en voer uit in je database
3. Herhaal voor `prisma/migrations/add_compound_indexes.sql`

## Optie 5: Vercel/Heroku/Railway Production Database

### Vercel Postgres:

```bash
# Installeer Vercel CLI als je dat nog niet hebt
npm i -g vercel

# Login en selecteer je project
vercel login
vercel link

# Haal database credentials op
vercel env pull .env.local

# Voer migraties uit
source .env.local
psql "$POSTGRES_URL" -f prisma/migrations/add_vector_index.sql
psql "$POSTGRES_URL" -f prisma/migrations/add_compound_indexes.sql
```

### Heroku:

```bash
# Voer uit via Heroku CLI
heroku pg:psql --app your-app-name < prisma/migrations/add_vector_index.sql
heroku pg:psql --app your-app-name < prisma/migrations/add_compound_indexes.sql
```

### Railway:

```bash
# Haal database URL op via Railway CLI
railway variables

# Export DATABASE_URL en voer migraties uit
export DATABASE_URL='...'
psql "$DATABASE_URL" -f prisma/migrations/add_vector_index.sql
psql "$DATABASE_URL" -f prisma/migrations/add_compound_indexes.sql
```

## Verificatie

Na het uitvoeren van de migraties, verifieer dat de indexes zijn aangemaakt:

```sql
-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN (
    'document_chunks',
    'conversation_messages',
    'websites',
    'website_pages',
    'conversation_sessions'
)
AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

Verwachte output (5 indexes):

```
indexname                                  | indexdef
-------------------------------------------|--------------------------------------------------
conversation_messages_session_created_idx  | CREATE INDEX ... (session_id, created_at DESC)
conversation_sessions_assistant_idx        | CREATE INDEX ... (assistant_id)
document_chunks_embedding_idx              | CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)
website_pages_website_id_idx              | CREATE INDEX ... (website_id)
websites_assistant_status_idx             | CREATE INDEX ... (assistant_id, status)
```

## Performance Testing

Test de verbeteringen:

```sql
-- Test 1: Vector similarity search (moet HNSW index gebruiken)
EXPLAIN ANALYZE
SELECT id, content, 1 - (embedding <=> '[0.1,0.2,...]'::vector) as similarity
FROM document_chunks
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.1,0.2,...]'::vector
LIMIT 10;

-- Verwachte output moet bevatten:
--   "Index Scan using document_chunks_embedding_idx"
--   Execution Time: ~5-50ms (was 500-2000ms)

-- Test 2: Conversation history (moet compound index gebruiken)
EXPLAIN ANALYZE
SELECT *
FROM conversation_messages
WHERE session_id = 'some-session-id'
ORDER BY created_at DESC
LIMIT 50;

-- Verwachte output moet bevatten:
--   "Index Scan using conversation_messages_session_created_idx"
--   Execution Time: ~50-150ms (was 200-500ms)
```

## Troubleshooting

### Error: "extension 'vector' does not exist"

**Oplossing:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Als dit niet werkt, moet je pgvector installeren op je PostgreSQL server.

### Error: "permission denied to create extension"

**Oplossing:** Je database user heeft geen SUPERUSER rechten. Vraag je database admin om:
```sql
CREATE EXTENSION vector;
```

### Error: "could not open extension control file"

**Oplossing:** pgvector is niet geïnstalleerd op je PostgreSQL server. Installeer het:

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15-pgvector
```

**macOS (Homebrew):**
```bash
brew install pgvector
```

**Docker:**
```dockerfile
FROM postgres:15
RUN apt-get update && apt-get install -y postgresql-15-pgvector
```

**Managed Services:**
- **Supabase**: pgvector is al geïnstalleerd ✅
- **Neon**: pgvector is al geïnstalleerd ✅
- **Railway**: Installeer via Nixpacks config
- **Render**: Vraag support om pgvector te installeren

### Index Creatie Duurt Erg Lang (>10 minuten)

Dit is normaal voor grote databases (>100k document chunks). De index wordt in de achtergrond gebouwd. Je kan het process monitoren:

```sql
SELECT
    now()::TIME(0),
    query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%document_chunks_embedding_idx%';
```

## Rollback (Als Nodig)

Als je de indexes wilt verwijderen:

```sql
-- Verwijder alle nieuwe indexes
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP INDEX IF EXISTS conversation_messages_session_created_idx;
DROP INDEX IF EXISTS websites_assistant_status_idx;
DROP INDEX IF EXISTS website_pages_website_id_idx;
DROP INDEX IF EXISTS conversation_sessions_assistant_idx;
```

## Impact Meting

Meet de impact voor/na migraties:

**Voor migraties:**
```bash
# Test semantic search response tijd
time curl -X POST https://your-domain.com/api/chat/message \
  -H "X-Chatbot-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"question": "test query"}'
```

**Na migraties:**
```bash
# Zelfde test - vergelijk response tijd
time curl -X POST https://your-domain.com/api/chat/message \
  -H "X-Chatbot-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"question": "test query"}'
```

Verwachte verbeteringen:
- Semantic search: 500-2000ms → 50-200ms (10-20x sneller)
- Conversation history: 200-500ms → 50-150ms (2-3x sneller)

## Ondersteuning

Voor meer details, zie:
- **Gedetailleerde instructies:** `prisma/migrations/MIGRATION_INSTRUCTIONS.md`
- **Audit rapport:** `PROJECT_AUDIT_REPORT.md`
- **SQL bestanden:** `prisma/migrations/*.sql`

## Checklist

- [ ] Database URL geconfigureerd
- [ ] pgvector extensie beschikbaar (voor vector index)
- [ ] Backup gemaakt (optioneel maar aanbevolen)
- [ ] Migratie uitgevoerd
- [ ] Indexes geverifieerd
- [ ] Performance getest
- [ ] Response tijden verbeterd

---

**Laatst bijgewerkt:** 2026-01-04
**Geschatte tijd:** 5-15 minuten
**Risk Level:** ⬜ Low (alleen indexes toevoegen, geen data wijzigingen)
