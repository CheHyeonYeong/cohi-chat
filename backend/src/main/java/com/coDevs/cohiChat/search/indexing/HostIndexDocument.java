package com.coDevs.cohiChat.search.indexing;

import java.util.Objects;
import java.util.UUID;

import com.coDevs.cohiChat.search.embedding.EmbeddingGenerationResult;

public record HostIndexDocument(
    UUID hostId,
    String sourceText,
    EmbeddingGenerationResult embedding
) {

    public HostIndexDocument {
        Objects.requireNonNull(hostId, "hostId must not be null");
        Objects.requireNonNull(sourceText, "sourceText must not be null");
        Objects.requireNonNull(embedding, "embedding must not be null");
    }
}
