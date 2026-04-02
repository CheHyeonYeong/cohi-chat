package com.coDevs.cohiChat.search.embedding;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.search.config.SearchEmbeddingProperties;

class DefaultEmbeddingServiceTest {

    @Test
    @DisplayName("임베딩이 비활성화되면 provider를 호출하지 않고 skipped 결과를 반환한다")
    void generateReturnsSkippedWhenDisabled() {
        SearchEmbeddingProperties properties = new SearchEmbeddingProperties();
        properties.setEnabled(false);

        FakeEmbeddingClient client = new FakeEmbeddingClient();
        DefaultEmbeddingService service = new DefaultEmbeddingService(List.of(client), properties);

        EmbeddingGenerationResult result = service.generate("직업: 백엔드 개발자");

        assertThat(result.generated()).isFalse();
        assertThat(result.vector()).isEmpty();
        assertThat(result.reason()).isEqualTo("embedding generation is disabled");
        assertThat(client.called).isFalse();
    }

    @Test
    @DisplayName("임베딩이 활성화되면 설정된 provider로 생성 요청을 위임한다")
    void generateDelegatesToConfiguredClient() {
        SearchEmbeddingProperties properties = new SearchEmbeddingProperties();
        properties.setEnabled(true);
        properties.setModel("embeddinggemma-ko");

        FakeEmbeddingClient client = new FakeEmbeddingClient();
        DefaultEmbeddingService service = new DefaultEmbeddingService(List.of(client), properties);

        EmbeddingGenerationResult result = service.generate("주제: 취업 상담");

        assertThat(client.called).isTrue();
        assertThat(client.lastText).isEqualTo("주제: 취업 상담");
        assertThat(result.generated()).isTrue();
        assertThat(result.provider()).isEqualTo(EmbeddingProviderType.EMBEDDING_GEMMA.name());
        assertThat(result.model()).isEqualTo("embeddinggemma-ko");
        assertThat(result.vector()).containsExactly(0.1f, 0.2f, 0.3f);
    }

    @Test
    @DisplayName("기본 EmbeddingGemma client는 미구현 상태를 skipped 결과로 반환한다")
    void generateReturnsSkippedWhenGemmaClientIsStub() {
        SearchEmbeddingProperties properties = new SearchEmbeddingProperties();
        properties.setEnabled(true);
        properties.setModel("embeddinggemma-ko");

        DefaultEmbeddingService service = new DefaultEmbeddingService(List.of(new EmbeddingGemmaClient()), properties);

        EmbeddingGenerationResult result = service.generate("주제: 취업 상담");

        assertThat(result.generated()).isFalse();
        assertThat(result.reason()).isEqualTo("EmbeddingGemma client integration is not implemented yet.");
    }

    @Test
    @DisplayName("활성화된 provider client가 없으면 예외를 발생시킨다")
    void generateThrowsWhenClientMissing() {
        SearchEmbeddingProperties properties = new SearchEmbeddingProperties();
        properties.setEnabled(true);

        DefaultEmbeddingService service = new DefaultEmbeddingService(List.of(), properties);

        assertThatThrownBy(() -> service.generate("소개: 멘토링"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("No embedding client registered");
    }

    @Test
    @DisplayName("source_text가 비어 있으면 skipped 결과를 반환한다")
    void generateReturnsSkippedWhenSourceTextBlank() {
        SearchEmbeddingProperties properties = new SearchEmbeddingProperties();
        properties.setEnabled(true);

        FakeEmbeddingClient client = new FakeEmbeddingClient();
        DefaultEmbeddingService service = new DefaultEmbeddingService(List.of(client), properties);

        EmbeddingGenerationResult result = service.generate("   ");

        assertThat(result.generated()).isFalse();
        assertThat(result.reason()).isEqualTo("source text is blank");
        assertThat(client.called).isFalse();
    }

    private static class FakeEmbeddingClient implements EmbeddingClient {

        private boolean called;
        private String lastText;

        @Override
        public EmbeddingProviderType getProviderType() {
            return EmbeddingProviderType.EMBEDDING_GEMMA;
        }

        @Override
        public EmbeddingGenerationResult generate(
            EmbeddingRequest request,
            SearchEmbeddingProperties properties
        ) {
            this.called = true;
            this.lastText = request.text();
            return EmbeddingGenerationResult.generated(
                getProviderType().name(),
                properties.getModel(),
                List.of(0.1f, 0.2f, 0.3f)
            );
        }
    }
}