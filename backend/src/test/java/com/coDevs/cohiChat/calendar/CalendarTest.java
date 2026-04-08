package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;

@ExtendWith(MockitoExtension.class)
class CalendarTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final List<String> TEST_TOPICS = List.of("커리어 상담", "이력서 리뷰");
    private static final String TEST_DESCRIPTION = "게스트에게 보여줄 설명입니다.";
    private static final String TEST_GOOGLE_CALENDAR_ID = "test@group.calendar.google.com";

    @Mock
    private Member member;

    @Test
    @DisplayName("성공: 모든 필수 항목이 존재하면 캘린더 생성")
    void createCalendarSuccess() {
        // given
        given(member.getId()).willReturn(TEST_USER_ID);

        // when
        Calendar calendar = Calendar.create(
            member,
            TEST_TOPICS,
            TEST_DESCRIPTION,
            TEST_GOOGLE_CALENDAR_ID
        );

        // then
        assertThat(calendar.getUserId()).isEqualTo(TEST_USER_ID);
        assertThat(calendar.getTopics()).isEqualTo(TEST_TOPICS);
        assertThat(calendar.getDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(calendar.getGoogleCalendarId()).isEqualTo(TEST_GOOGLE_CALENDAR_ID);
    }
}
