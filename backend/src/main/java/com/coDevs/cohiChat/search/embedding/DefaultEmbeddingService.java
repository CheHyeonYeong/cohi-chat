package com.coDevs.cohiChat.search.embedding;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.search.config.SearchEmbeddingProperties;

@Service
public class DefaultEmbeddingService implements EmbeddingService {

    private final SearchEmbeddingProperties properties;
    private final Map<EmbeddingProviderType, EmbeddingClient> clients;

    public DefaultEmbeddingService(List<EmbeddingClient> clients, SearchEmbeddingProperties properties) {
        this.properties = properties;
        this.clients = new EnumMap<>(EmbeddingProviderType.class);
        for (EmbeddingClient client : clients) {
            this.clients.put(client.getProviderType(), client);
        }
    }

    @Override
    public EmbeddingGenerationResult generate(String sourceText) {
        if (sourceText == null || sourceText.isBlank()) {
            return EmbeddingGenerationResult.skipped(
                properties.getProvider().name(),
                properties.getModel(),
                "source text is blank"
            );
        }

        if (!properties.isEnabled()) {
            return EmbeddingGenerationResult.skipped(
                properties.getProvider().name(),
                properties.getModel(),
                "embedding generation is disabled"
            );
        }

        EmbeddingClient client = clients.get(properties.getProvider());
        if (client == null) {
            throw new IllegalStateException("No embedding client registered for provider: " + properties.getProvider());
        }

        return client.generate(new EmbeddingRequest(sourceText), properties);
    }
}
