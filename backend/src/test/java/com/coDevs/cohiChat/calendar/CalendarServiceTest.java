package com.coDevs.cohiChat.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;
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
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;

import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarService;
import com.coDevs.cohiChat.member.MemberRepository;
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
    private MemberRepository memberRepository;

    @Mock
    private GoogleCalendarService googleCalendarService;

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
    @DisplayName("성공: 게스트가 캘린더 생성 시 GUEST→HOST 자동 승격")
    void createCalendarAutoPromoteGuest() {
        // given
        given(hostMember.getId()).willReturn(TEST_USER_ID);
        given(hostMember.getRole()).willReturn(Role.GUEST);
        given(calendarRepository.existsByUserId(TEST_USER_ID)).willReturn(false);
        given(calendarRepository.save(any(Calendar.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        CalendarResponseDTO response = calendarService.createCalendar(hostMember, requestDTO);

        // then
        verify(hostMember).promoteToHost();
        verify(memberRepository).save(hostMember);
        assertThat(response.getTopics()).isEqualTo(TEST_TOPICS);
    }

    @Test
    @DisplayName("실패: 이미 캘린더가 존재하면 CALENDAR_ALREADY_EXISTS 예외")
    void createCalendarFailWhenAlreadyExists() {
        // given
        given(hostMember.getId()).willReturn(TEST_USER_ID);
        given(calendarRepository.existsByUserId(TEST_USER_ID)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> calendarService.createCalendar(hostMember, requestDTO))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("성공: 호스트가 캘린더 조회 (기존 호스트: calendarAccessible null → Google API 1회 호출 후 저장)")
    void getCalendarSuccess() {
        // given
        givenHostMember();
        Calendar calendar = Calendar.create(TEST_USER_ID, TEST_TOPICS, TEST_DESCRIPTION, TEST_GOOGLE_CALENDAR_ID);
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));
        given(googleCalendarService.checkCalendarAccess(TEST_GOOGLE_CALENDAR_ID)).willReturn(true);

        // when
        CalendarResponseDTO response = calendarService.getCalendar(hostMember);

        // then
        assertThat(response.getTopics()).isEqualTo(TEST_TOPICS);
        assertThat(response.getDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(response.getGoogleCalendarId()).isEqualTo(TEST_GOOGLE_CALENDAR_ID);
        assertThat(response.getCalendarAccessible()).isTrue();
    }

    @Test
    @DisplayName("성공: calendarAccessible이 이미 저장된 호스트 조회 시 Google API 호출 없음")
    void getCalendarSuccessWhenAccessibleAlreadyCached() {
        // given
        givenHostMember();
        Calendar calendar = Calendar.create(TEST_USER_ID, TEST_TOPICS, TEST_DESCRIPTION, TEST_GOOGLE_CALENDAR_ID);
        calendar.setCalendarAccessible(true);
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));

        // when
        CalendarResponseDTO response = calendarService.getCalendar(hostMember);

        // then
        assertThat(response.getCalendarAccessible()).isTrue();
        then(googleCalendarService).should(never()).checkCalendarAccess(any());
    }

    @Test
    @DisplayName("실패: 게스트가 캘린더 조회 시도 시 GUEST_ACCESS_DENIED 예외")
    void getCalendarFailWhenGuest() {
        // given
        given(hostMember.getRole()).willReturn(Role.GUEST);

        // when & then
        assertThatThrownBy(() -> calendarService.getCalendar(hostMember))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GUEST_ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 캘린더가 없으면 CALENDAR_NOT_FOUND 예외")
    void getCalendarFailWhenNotFound() {
        // given
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> calendarService.getCalendar(hostMember))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_NOT_FOUND);
    }

    @Test
    @DisplayName("성공: 호스트가 캘린더 수정")
    void updateCalendarSuccess() {
        // given
        givenHostMember();
        Calendar calendar = Calendar.create(TEST_USER_ID, TEST_TOPICS, TEST_DESCRIPTION, TEST_GOOGLE_CALENDAR_ID);
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.of(calendar));

        List<String> updatedTopics = List.of("새로운 주제");
        String updatedDescription = "수정된 설명입니다. 10자 이상입니다.";
        String updatedGoogleCalendarId = "updated@group.calendar.google.com";

        CalendarUpdateRequestDTO updateRequest = CalendarUpdateRequestDTO.builder()
            .topics(updatedTopics)
            .description(updatedDescription)
            .googleCalendarId(updatedGoogleCalendarId)
            .build();

        // when
        CalendarResponseDTO response = calendarService.updateCalendar(hostMember, updateRequest);

        // then
        assertThat(response.getTopics()).isEqualTo(updatedTopics);
        assertThat(response.getDescription()).isEqualTo(updatedDescription);
        assertThat(response.getGoogleCalendarId()).isEqualTo(updatedGoogleCalendarId);
    }

    @Test
    @DisplayName("실패: 게스트가 캘린더 수정 시도 시 GUEST_ACCESS_DENIED 예외")
    void updateCalendarFailWhenGuest() {
        // given
        given(hostMember.getRole()).willReturn(Role.GUEST);

        CalendarUpdateRequestDTO updateRequest = CalendarUpdateRequestDTO.builder()
            .topics(List.of("새로운 주제"))
            .description("수정된 설명입니다.")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        // when & then
        assertThatThrownBy(() -> calendarService.updateCalendar(hostMember, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.GUEST_ACCESS_DENIED);
    }

    @Test
    @DisplayName("실패: 수정할 캘린더가 없으면 CALENDAR_NOT_FOUND 예외")
    void updateCalendarFailWhenNotFound() {
        // given
        givenHostMember();
        given(calendarRepository.findByUserId(TEST_USER_ID)).willReturn(Optional.empty());

        CalendarUpdateRequestDTO updateRequest = CalendarUpdateRequestDTO.builder()
            .topics(List.of("새로운 주제"))
            .description("수정된 설명입니다.")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        // when & then
        assertThatThrownBy(() -> calendarService.updateCalendar(hostMember, updateRequest))
            .isInstanceOf(CustomException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_NOT_FOUND);
    }

}
