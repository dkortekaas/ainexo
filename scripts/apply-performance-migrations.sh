#!/bin/bash

# Performance Optimization Database Migrations
# This script applies the critical performance indexes identified in the audit

set -e  # Exit on error

echo "🚀 AiNexo - Performance Optimization Migrations"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set your DATABASE_URL:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Or create a .env file with:"
    echo "  DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

echo -e "${GREEN}✅ Database connection configured${NC}"
echo ""

# Function to run SQL file
run_migration() {
    local file=$1
    local description=$2

    echo -e "${YELLOW}📝 Applying: $description${NC}"
    echo "   File: $file"

    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Success${NC}"
        return 0
    else
        echo -e "${RED}   ❌ Failed${NC}"
        return 1
    fi
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found, trying with npx prisma${NC}"
    USE_PRISMA=true
else
    echo -e "${GREEN}✅ PostgreSQL client (psql) found${NC}"
    USE_PRISMA=false
fi

echo ""
echo "Starting migrations..."
echo "======================"
echo ""

# Migration 1: Vector Index (CRITICAL)
echo -e "${YELLOW}[1/2] Vector Index Migration${NC}"
echo "      Impact: 10-100x faster semantic search"
echo ""

if [ "$USE_PRISMA" = true ]; then
    echo "Using Prisma to execute migration..."
    npx prisma db execute --file prisma/migrations/add_vector_index.sql --schema prisma/schema.prisma
else
    run_migration "prisma/migrations/add_vector_index.sql" "HNSW Vector Index"
fi

echo ""

# Migration 2: Compound Indexes (HIGH)
echo -e "${YELLOW}[2/2] Compound Indexes Migration${NC}"
echo "      Impact: 2-3x faster common queries"
echo ""

if [ "$USE_PRISMA" = true ]; then
    echo "Using Prisma to execute migration..."
    npx prisma db execute --file prisma/migrations/add_compound_indexes.sql --schema prisma/schema.prisma
else
    run_migration "prisma/migrations/add_compound_indexes.sql" "Compound Indexes"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo "=============================================="
echo ""

# Verify indexes were created
echo "Verifying indexes..."
echo ""

VERIFY_SQL="SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexname IN (
    'document_chunks_embedding_idx',
    'conversation_messages_session_created_idx',
    'websites_assistant_status_idx',
    'website_pages_website_id_idx',
    'conversation_sessions_assistant_idx'
)
ORDER BY indexname;"

if [ "$USE_PRISMA" = false ]; then
    echo "Created indexes:"
    psql "$DATABASE_URL" -c "$VERIFY_SQL" 2>/dev/null || echo "Could not verify indexes"
fi

echo ""
echo "Next steps:"
echo "1. Test semantic search performance"
echo "2. Monitor database CPU usage (should be lower)"
echo "3. Check API response times (should be faster)"
echo ""
echo "For detailed testing instructions, see:"
echo "  prisma/migrations/MIGRATION_INSTRUCTIONS.md"
echo ""
