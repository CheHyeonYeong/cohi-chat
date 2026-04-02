package com.coDevs.cohiChat.search.embedding;

public interface EmbeddingService {

    EmbeddingGenerationResult generate(String sourceText);
}
