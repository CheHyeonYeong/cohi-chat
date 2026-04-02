package com.coDevs.cohiChat.search.indexing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.search.document.HostSearchDocumentSource;
import com.coDevs.cohiChat.search.document.HostSearchSourceTextBuilder;
import com.coDevs.cohiChat.search.embedding.EmbeddingGenerationResult;
import com.coDevs.cohiChat.search.embedding.EmbeddingService;

class DefaultHostIndexingServiceTest {

    @Test
    @DisplayName("host와 calendar 데이터로 index document를 구성한다")
    void buildCreatesIndexDocument() {
        Member member = Member.create("hostuser", "Host User", "host@test.com", "hashedPw123", Role.HOST);
        member.updateProfile("백엔드 개발자", null);

        UUID hostId = UUID.randomUUID();
        Calendar calendar = Calendar.create(
            hostId,
            List.of("취업 상담", "이직 상담"),
            "백엔드 커리어와 포트폴리오를 함께 리뷰합니다.",
            "calendar-id"
        );

        EmbeddingService embeddingService = sourceText -> EmbeddingGenerationResult.skipped(
            "EMBEDDING_GEMMA",
            "embeddinggemma",
            "test stub"
        );

        DefaultHostIndexingService service = new DefaultHostIndexingService(
            new HostSearchSourceTextBuilder(),
            embeddingService
        );

        HostIndexDocument result = service.build(member, calendar);

        assertThat(result.hostId()).isEqualTo(hostId);
        assertThat(result.sourceText()).isEqualTo(String.join("\n",
            "직업: 백엔드 개발자",
            "주제: 취업 상담, 이직 상담",
            "소개: 백엔드 커리어와 포트폴리오를 함께 리뷰합니다."
        ));
        assertThat(result.embedding().generated()).isFalse();
        assertThat(result.embedding().reason()).isEqualTo("test stub");
    }

    @Test
    @DisplayName("member와 calendar의 host id가 다르면 예외를 발생시킨다")
    void buildThrowsWhenMemberAndCalendarHostDoNotMatch() {
        Member member = Member.create("hostuser", "Host User", "host@test.com", "hashedPw123", Role.HOST);
        member.updateProfile("백엔드 개발자", null);
        ReflectionTestUtils.setField(member, "id", UUID.randomUUID());

        Calendar calendar = Calendar.create(
            UUID.randomUUID(),
            List.of("취업 상담"),
            "설명",
            "calendar-id"
        );

        EmbeddingService embeddingService = sourceText -> EmbeddingGenerationResult.skipped(
            "EMBEDDING_GEMMA",
            "embeddinggemma",
            "test stub"
        );

        DefaultHostIndexingService service = new DefaultHostIndexingService(
            new HostSearchSourceTextBuilder(),
            embeddingService
        );

        assertThatThrownBy(() -> service.build(member, calendar))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("member.id and calendar.userId must match");
    }

    @Test
    @DisplayName("조합된 source_text가 비어 있으면 예외를 발생시킨다")
    void buildThrowsWhenSourceTextBlank() {
        HostSearchDocumentSource source = new HostSearchDocumentSource(
            UUID.randomUUID(),
            "   ",
            List.of(" ", "\t"),
            null
        );

        EmbeddingService embeddingService = sourceText -> EmbeddingGenerationResult.skipped(
            "EMBEDDING_GEMMA",
            "embeddinggemma",
            "test stub"
        );

        DefaultHostIndexingService service = new DefaultHostIndexingService(
            new HostSearchSourceTextBuilder(),
            embeddingService
        );

        assertThatThrownBy(() -> service.build(source))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("sourceText must not be blank");
    }
}