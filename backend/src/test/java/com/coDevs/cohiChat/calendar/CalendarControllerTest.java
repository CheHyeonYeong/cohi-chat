package com.coDevs.cohiChat.calendar;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(CalendarController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "testuser")
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
            .userId(UUID.randomUUID())
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
                .with(csrf())
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
                .with(csrf())
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
                .with(csrf())
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
            .thenThrow(new CustomException(ErrorCode.GUEST_ACCESS_DENIED ));

        // when & then
        mockMvc.perform(post("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.GUEST_ACCESS_DENIED.toString()));
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
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.CALENDAR_ALREADY_EXISTS.toString()));
    }

    @Test
    @DisplayName("성공: 캘린더 조회 요청 시 200 OK 반환")
    void getCalendarSuccess() throws Exception {
        // given
        CalendarResponseDTO response = CalendarResponseDTO.builder()
            .userId(UUID.randomUUID())
            .topics(TEST_TOPICS)
            .description(TEST_DESCRIPTION)
            .googleCalendarId(TEST_GOOGLE_CALENDAR_ID)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(calendarService.getCalendar(any(Member.class))).thenReturn(response);

        // when & then
        mockMvc.perform(get("/calendar/v1")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.topics[0]").value("커리어 상담"))
            .andExpect(jsonPath("$.description").value(TEST_DESCRIPTION));
    }

    @Test
    @DisplayName("실패: 게스트가 캘린더 조회 시 403 Forbidden")
    void getCalendarFailWhenGuest() throws Exception {
        // given
        when(calendarService.getCalendar(any(Member.class)))
            .thenThrow(new CustomException(ErrorCode.GUEST_ACCESS_DENIED));

        // when & then
        mockMvc.perform(get("/calendar/v1")
                .with(csrf()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.GUEST_ACCESS_DENIED.toString()));
    }

    @Test
    @DisplayName("실패: 캘린더가 없으면 404 Not Found")
    void getCalendarFailWhenNotFound() throws Exception {
        // given
        when(calendarService.getCalendar(any(Member.class)))
            .thenThrow(new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/calendar/v1")
                .with(csrf()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.CALENDAR_NOT_FOUND.toString()));
    }

    @Test
    @DisplayName("성공: 캘린더 수정 요청 시 200 OK 반환")
    void updateCalendarSuccess() throws Exception {
        // given
        List<String> updatedTopics = List.of("새로운 주제");
        String updatedDescription = "수정된 설명입니다. 10자 이상입니다.";
        String updatedGoogleCalendarId = "updated@group.calendar.google.com";

        CalendarUpdateRequestDTO request = CalendarUpdateRequestDTO.builder()
            .topics(updatedTopics)
            .description(updatedDescription)
            .googleCalendarId(updatedGoogleCalendarId)
            .build();

        CalendarResponseDTO response = CalendarResponseDTO.builder()
            .userId(UUID.randomUUID())
            .topics(updatedTopics)
            .description(updatedDescription)
            .googleCalendarId(updatedGoogleCalendarId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(calendarService.updateCalendar(any(Member.class), any(CalendarUpdateRequestDTO.class)))
            .thenReturn(response);

        // when & then
        mockMvc.perform(put("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.topics[0]").value("새로운 주제"))
            .andExpect(jsonPath("$.description").value(updatedDescription));
    }

    @Test
    @DisplayName("실패: 게스트가 캘린더 수정 시 403 Forbidden")
    void updateCalendarFailWhenGuest() throws Exception {
        // given
        CalendarUpdateRequestDTO request = CalendarUpdateRequestDTO.builder()
            .topics(List.of("새로운 주제"))
            .description("수정된 설명입니다. 10자 이상입니다.")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        when(calendarService.updateCalendar(any(Member.class), any(CalendarUpdateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.GUEST_ACCESS_DENIED));

        // when & then
        mockMvc.perform(put("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.GUEST_ACCESS_DENIED.toString()));
    }

    @Test
    @DisplayName("실패: 수정할 캘린더가 없으면 404 Not Found")
    void updateCalendarFailWhenNotFound() throws Exception {
        // given
        CalendarUpdateRequestDTO request = CalendarUpdateRequestDTO.builder()
            .topics(List.of("새로운 주제"))
            .description("수정된 설명입니다. 10자 이상입니다.")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        when(calendarService.updateCalendar(any(Member.class), any(CalendarUpdateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        // when & then
        mockMvc.perform(put("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.CALENDAR_NOT_FOUND.toString()));
    }

    @Test
    @DisplayName("실패: 수정 시 topics가 비어있으면 400 Bad Request")
    void updateCalendarFailWhenTopicsEmpty() throws Exception {
        // given
        CalendarUpdateRequestDTO request = CalendarUpdateRequestDTO.builder()
            .topics(List.of())
            .description("수정된 설명입니다. 10자 이상입니다.")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        // when & then
        mockMvc.perform(put("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: 수정 시 description이 10자 미만이면 400 Bad Request")
    void updateCalendarFailWhenDescriptionTooShort() throws Exception {
        // given
        CalendarUpdateRequestDTO request = CalendarUpdateRequestDTO.builder()
            .topics(List.of("새로운 주제"))
            .description("짧은설명")
            .googleCalendarId("updated@group.calendar.google.com")
            .build();

        // when & then
        mockMvc.perform(put("/calendar/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

}
