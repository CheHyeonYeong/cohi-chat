package com.coDevs.cohiChat.search.embedding;

import org.springframework.stereotype.Component;

import com.coDevs.cohiChat.search.config.SearchEmbeddingProperties;

@Component
public class EmbeddingGemmaClient implements EmbeddingClient {

    @Override
    public EmbeddingProviderType getProviderType() {
        return EmbeddingProviderType.EMBEDDING_GEMMA;
    }

    @Override
    public EmbeddingGenerationResult generate(EmbeddingRequest request, SearchEmbeddingProperties properties) {
        return EmbeddingGenerationResult.skipped(
            getProviderType().name(),
            properties.getModel(),
            "EmbeddingGemma client integration is not implemented yet."
        );
    }
}