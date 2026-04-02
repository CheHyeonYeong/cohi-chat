package com.coDevs.cohiChat.search.embedding;

import java.util.Objects;

public record EmbeddingRequest(String text) {

    public EmbeddingRequest {
        Objects.requireNonNull(text, "text must not be null");
    }
}
