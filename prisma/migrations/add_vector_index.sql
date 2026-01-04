-- Add HNSW index for vector similarity search on document_chunks.embedding
-- This improves semantic search performance by 10-100x
-- HNSW (Hierarchical Navigable Small World) is the recommended index type for pgvector

-- Check if pgvector extension exists, if not create it
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index using cosine distance operator
-- This index will dramatically speed up vector similarity searches
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING hnsw (embedding vector_cosine_ops);

-- Optional: Create index with custom parameters for better performance
-- m: maximum number of connections per layer (default 16, higher = better recall but more memory)
-- ef_construction: size of dynamic candidate list (default 64, higher = better index quality but slower build)
-- Uncomment below if you want to tune these parameters:

-- DROP INDEX IF EXISTS document_chunks_embedding_idx;
-- CREATE INDEX document_chunks_embedding_idx
-- ON document_chunks
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);
