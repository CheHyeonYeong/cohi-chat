package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final List<String> TEST_TOPICS = List.of("커리어 상담", "이력서 리뷰");
    private static final String TEST_DESCRIPTION = "게스트에게 보여줄 설명입니다.";
    private static final String TEST_GOOGLE_CALENDAR_ID = "test@group.calendar.google.com";

    @Mock
    private CalendarRepository calendarRepository;

    @Mock
    private Member hostMember;

    @InjectMocks
    private CalendarService calendarService;

    private CalendarCreateRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        requestDTO = CalendarCreateRequestDTO.builder()
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();
    }

    private void givenHostMember() {
        given(hostMember.getId()).willReturn(TEST_USER_ID);
        given(hostMember.getRole()).willReturn(Role.HOST);
    }

    private void givenSuccessfulCreateMocks() {
        givenHostMember();
        given(calendarRepository.existsByUserId(TEST_USER_ID)).willReturn(false);
        given(calendarRepository.save(any(Calendar.class))).willAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("성공: 호스트가 캘린더 생성")
    void createCalendarSuccess() {
        // given
        givenSuccessfulCreateMocks();

        // when
        CalendarResponseDTO response = calendarService.createCalendar(hostMember, requestDTO);

        // then
        assertThat(response.getTopics()).isEqualTo(TEST_TOPICS);
        assertThat(response.getDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(response.getGoogleCalendarId()).isEqualTo(TEST_GOOGLE_CALENDAR_ID);
    }

    @Test
    @DisplayName("실패: 게스트가 캘린더 생성 시도 시 GUEST_PERMISSION 예외")
    void createCalendarFailWhenGuest() {
        // given
        given(hostMember.getRole()).willReturn(Role.GUEST);

        // when & then
        assertThatThrownBy(() -> calendarService.createCalendar(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GUEST_ACCESS_DENIED );
    }

    @Test
    @DisplayName("실패: 이미 캘린더가 존재하면 CALENDAR_ALREADY_EXISTS 예외")
    void createCalendarFailWhenAlreadyExists() {
        // given
        givenHostMember();
        given(calendarRepository.existsByUserId(TEST_USER_ID)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> calendarService.createCalendar(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_ALREADY_EXISTS);
    }
}
