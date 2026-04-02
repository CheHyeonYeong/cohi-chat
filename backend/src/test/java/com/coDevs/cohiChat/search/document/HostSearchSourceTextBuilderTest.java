package com.coDevs.cohiChat.search.document;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class HostSearchSourceTextBuilderTest {

    private final HostSearchSourceTextBuilder builder = new HostSearchSourceTextBuilder();

    @Test
    @DisplayName("job, topics, description을 라벨과 함께 source_text로 조합한다")
    void buildComposesLabeledSourceText() {
        HostSearchDocumentSource source = new HostSearchDocumentSource(
            UUID.randomUUID(),
            "  백엔드   개발자  ",
            List.of(" 취업 상담 ", "Java/Spring", "취업 상담"),
            "  신입  백엔드 취업과 이직을 상담합니다. "
        );

        String sourceText = builder.build(source);

        assertThat(sourceText).isEqualTo(String.join("\n",
            "직업: 백엔드 개발자",
            "주제: 취업 상담, Java/Spring",
            "소개: 신입 백엔드 취업과 이직을 상담합니다."
        ));
    }

    @Test
    @DisplayName("빈 값과 공백 topic은 제외하고 유효한 항목만 조합한다")
    void buildOmitsBlankSections() {
        HostSearchDocumentSource source = new HostSearchDocumentSource(
            UUID.randomUUID(),
            "   ",
            Arrays.asList("  ", "포트폴리오 리뷰", null),
            "\n  "
        );

        String sourceText = builder.build(source);

        assertThat(sourceText).isEqualTo("주제: 포트폴리오 리뷰");
    }

    @Test
    @DisplayName("모든 필드가 비어 있으면 빈 문자열을 반환한다")
    void buildReturnsEmptyStringWhenAllFieldsBlank() {
        HostSearchDocumentSource source = new HostSearchDocumentSource(
            UUID.randomUUID(),
            null,
            List.of(" ", "\t"),
            null
        );

        String sourceText = builder.build(source);

        assertThat(sourceText).isEmpty();
    }
}
