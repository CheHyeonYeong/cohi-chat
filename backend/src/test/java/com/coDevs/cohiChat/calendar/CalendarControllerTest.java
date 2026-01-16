package com.coDevs.cohiChat.calendar;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(CalendarController.class)
@AutoConfigureMockMvc(addFilters = false)
class CalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CalendarService calendarService;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private static final String TEST_USERNAME = "testuser";
    private static final List<String> TEST_TOPICS = List.of("커리어 상담", "이력서 리뷰");
    private static final String TEST_DESCRIPTION = "게스트에게 보여줄 설명입니다.";
    private static final String TEST_GOOGLE_CALENDAR_ID = "test@group.calendar.google.com";

    private Member mockMember;

    @BeforeEach
    void setUp() {
        mockMember = mock(Member.class);
        when(mockMember.getId()).thenReturn(UUID.randomUUID());
        when(mockMember.getRole()).thenReturn(Role.HOST);
        when(memberService.getMember(any())).thenReturn(mockMember);
    }

    @Test
    @DisplayName("성공: 캘린더 생성 요청 시 201 Created 반환")
    void createCalendarSuccess() throws Exception {
        // given
        CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();

        CalendarResponseDTO response = CalendarResponseDTO.builder()
            .id(UUID.randomUUID())
            .hostId(UUID.randomUUID())
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(calendarService.createCalendar(any(Member.class), any(CalendarCreateRequestDTO.class)))
            .thenReturn(response);

        // when & then
        mockMvc.perform(post("/calendar/v1")
                                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.topics[0]").value("커리어 상담"))
            .andExpect(jsonPath("$.description").value(TEST_DESCRIPTION));
    }

    @Test
    @DisplayName("실패: topics가 비어있으면 400 Bad Request")
    void createCalendarFailWhenTopicsEmpty() throws Exception {
        // given
        CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
            .topics(List.of())
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();

        // when & then
        mockMvc.perform(post("/calendar/v1")
                                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: description이 10자 미만이면 400 Bad Request")
    void createCalendarFailWhenDescriptionTooShort() throws Exception {
        // given
        CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
            .topics(TEST_TOPICS)
            .description("짧은설명")
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();

        // when & then
        mockMvc.perform(post("/calendar/v1")
                                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: 게스트가 생성 시도 시 403 Forbidden")
    void createCalendarFailWhenGuest() throws Exception {
        // given
        CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();

        when(calendarService.createCalendar(any(Member.class), any(CalendarCreateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.GUEST_PERMISSION));

        // when & then
        mockMvc.perform(post("/calendar/v1")
                                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("GUEST_PERMISSION"));
    }

    @Test
    @DisplayName("실패: 이미 캘린더가 존재하면 409 Conflict")
    void createCalendarFailWhenAlreadyExists() throws Exception {
        // given
        CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .build();

        when(calendarService.createCalendar(any(Member.class), any(CalendarCreateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.CALENDAR_ALREADY_EXISTS));

        // when & then
        mockMvc.perform(post("/calendar/v1")
                                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("CALENDAR_ALREADY_EXISTS"));
    }
}
