package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

class CalendarTest {

    private static final UUID TEST_HOST_ID = UUID.randomUUID();
    private static final List<String> TEST_TOPICS = List.of("커리어 상담", "이력서 리뷰");
    private static final String TEST_DESCRIPTION = "게스트에게 보여줄 설명입니다.";
    private static final String TEST_GOOGLE_CALENDAR_ID = "test@group.calendar.google.com";

    @Test
    @DisplayName("성공: 모든 필수 항목이 존재하면 캘린더 생성")
    void createCalendarSuccess() {
        // when
        Calendar calendar = Calendar.create(
            TEST_HOST_ID,
            TEST_TOPICS,
            TEST_DESCRIPTION,
            TEST_GOOGLE_CALENDAR_ID
        );

        // then
        assertThat(calendar.getHostId()).isEqualTo(TEST_HOST_ID);
        assertThat(calendar.getTopics()).isEqualTo(TEST_TOPICS);
        assertThat(calendar.getDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(calendar.getGoogleCalendarId()).isEqualTo(TEST_GOOGLE_CALENDAR_ID);
        assertThat(calendar.isDeleted()).isFalse();
    }

    @Test
    @DisplayName("실패: topics가 null이면 예외 발생")
    void createCalendarFailWhenTopicsNull() {
        assertThatThrownBy(() -> Calendar.create(
            TEST_HOST_ID,
            null,
            TEST_DESCRIPTION,
            TEST_GOOGLE_CALENDAR_ID
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("실패: topics가 비어있으면 예외 발생")
    void createCalendarFailWhenTopicsEmpty() {
        assertThatThrownBy(() -> Calendar.create(
            TEST_HOST_ID,
            List.of(),
            TEST_DESCRIPTION,
            TEST_GOOGLE_CALENDAR_ID
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("실패: description이 10자 미만이면 예외 발생")
    void createCalendarFailWhenDescriptionTooShort() {
        assertThatThrownBy(() -> Calendar.create(
            TEST_HOST_ID,
            TEST_TOPICS,
            "짧은설명",
            TEST_GOOGLE_CALENDAR_ID
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("실패: description이 null이면 예외 발생")
    void createCalendarFailWhenDescriptionNull() {
        assertThatThrownBy(() -> Calendar.create(
            TEST_HOST_ID,
            TEST_TOPICS,
            null,
            TEST_GOOGLE_CALENDAR_ID
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("실패: googleCalendarId가 null이면 예외 발생")
    void createCalendarFailWhenGoogleCalendarIdNull() {
        assertThatThrownBy(() -> Calendar.create(
            TEST_HOST_ID,
            TEST_TOPICS,
            TEST_DESCRIPTION,
            null
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    @DisplayName("실패: hostId가 null이면 예외 발생")
    void createCalendarFailWhenHostIdNull() {
        assertThatThrownBy(() -> Calendar.create(
            null,
            TEST_TOPICS,
            TEST_DESCRIPTION,
            TEST_GOOGLE_CALENDAR_ID
        ))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }
}
