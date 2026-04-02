package com.coDevs.cohiChat.search.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.coDevs.cohiChat.search.embedding.EmbeddingProviderType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "search.embedding")
public class SearchEmbeddingProperties {

    private boolean enabled = false;
    private EmbeddingProviderType provider = EmbeddingProviderType.EMBEDDING_GEMMA;
    private String model = "embeddinggemma";
    private int dimensions = 768;
}
