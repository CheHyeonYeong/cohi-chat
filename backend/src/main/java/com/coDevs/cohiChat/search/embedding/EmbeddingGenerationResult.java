package com.coDevs.cohiChat.search.embedding;

import java.util.List;

public record EmbeddingGenerationResult(
    String provider,
    String model,
    boolean generated,
    List<Float> vector,
    String reason
) {

    public EmbeddingGenerationResult {
        vector = vector == null ? List.of() : List.copyOf(vector);
    }

    public static EmbeddingGenerationResult generated(String provider, String model, List<Float> vector) {
        return new EmbeddingGenerationResult(provider, model, true, vector, null);
    }

    public static EmbeddingGenerationResult skipped(String provider, String model, String reason) {
        return new EmbeddingGenerationResult(provider, model, false, List.of(), reason);
    }
}
