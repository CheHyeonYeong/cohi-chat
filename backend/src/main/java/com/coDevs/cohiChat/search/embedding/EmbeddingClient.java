package com.coDevs.cohiChat.search.embedding;

import com.coDevs.cohiChat.search.config.SearchEmbeddingProperties;

public interface EmbeddingClient {

    EmbeddingProviderType getProviderType();

    EmbeddingGenerationResult generate(EmbeddingRequest request, SearchEmbeddingProperties properties);
}
