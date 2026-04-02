package com.coDevs.cohiChat.search.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.coDevs.cohiChat.search.embedding.DefaultEmbeddingService;
import com.coDevs.cohiChat.search.embedding.EmbeddingClient;
import com.coDevs.cohiChat.search.embedding.EmbeddingGemmaClient;
import com.coDevs.cohiChat.search.embedding.EmbeddingGenerationResult;
import com.coDevs.cohiChat.search.embedding.EmbeddingService;

class SearchEmbeddingConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
        .withUserConfiguration(SearchEmbeddingTestConfiguration.class)
        .withPropertyValues(
            "search.embedding.enabled=true",
            "search.embedding.provider=EMBEDDING_GEMMA",
            "search.embedding.model=embeddinggemma-ko",
            "search.embedding.dimensions=1024"
        );

    @Test
    @DisplayName("search.embedding 설정값이 properties에 바인딩된다")
    void bindsSearchEmbeddingProperties() {
        contextRunner.run(context -> {
            SearchEmbeddingProperties properties = context.getBean(SearchEmbeddingProperties.class);

            assertThat(properties.isEnabled()).isTrue();
            assertThat(properties.getProvider()).isEqualTo(com.coDevs.cohiChat.search.embedding.EmbeddingProviderType.EMBEDDING_GEMMA);
            assertThat(properties.getModel()).isEqualTo("embeddinggemma-ko");
            assertThat(properties.getDimensions()).isEqualTo(1024);
        });
    }

    @Test
    @DisplayName("임베딩 서비스 빈이 설정된 provider와 model을 사용한다")
    void wiresEmbeddingServiceBean() {
        contextRunner.run(context -> {
            EmbeddingService embeddingService = context.getBean(EmbeddingService.class);

            EmbeddingGenerationResult result = embeddingService.generate("주제: 취업 상담");

            assertThat(result.generated()).isFalse();
            assertThat(result.provider()).isEqualTo("EMBEDDING_GEMMA");
            assertThat(result.model()).isEqualTo("embeddinggemma-ko");
            assertThat(result.reason()).isEqualTo("EmbeddingGemma client integration is not implemented yet.");
        });
    }

    @Configuration
    @EnableConfigurationProperties(SearchEmbeddingProperties.class)
    static class SearchEmbeddingTestConfiguration {

        @Bean
        EmbeddingClient embeddingClient() {
            return new EmbeddingGemmaClient();
        }

        @Bean
        EmbeddingService embeddingService(List<EmbeddingClient> clients, SearchEmbeddingProperties properties) {
            return new DefaultEmbeddingService(clients, properties);
        }
    }
}