CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS host_search_document (
    host_id UUID PRIMARY KEY,
    source_text TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_host_search_document_updated_at
    ON host_search_document (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_search_document_embedding_cosine
    ON host_search_document
    USING hnsw (embedding vector_cosine_ops);
