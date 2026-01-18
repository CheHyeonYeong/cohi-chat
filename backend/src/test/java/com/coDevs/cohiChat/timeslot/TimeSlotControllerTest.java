package com.coDevs.cohiChat.timeslot;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.LocalTime;
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

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.request.TimeSlotCreateRequestDTO;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(TimeSlotController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "testuser")
class TimeSlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TimeSlotService timeSlotService;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private static final String TEST_USERNAME = "testuser";
    private static final UUID TEST_CALENDAR_ID = UUID.randomUUID();
    private static final LocalTime TEST_START_TIME = LocalTime.of(10, 0);
    private static final LocalTime TEST_END_TIME = LocalTime.of(11, 0);
    private static final List<Integer> TEST_WEEKDAYS = List.of(0, 1, 2);

    private Member mockMember;

    @BeforeEach
    void setUp() {
        mockMember = mock(Member.class);
        when(mockMember.getId()).thenReturn(UUID.randomUUID());
        when(mockMember.getRole()).thenReturn(Role.HOST);
        when(memberService.getMember(any())).thenReturn(mockMember);
    }

    @Test
    @DisplayName("성공: 타임슬롯 생성 요청 시 201 Created 반환")
    void createTimeSlotSuccess() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .build();

        TimeSlotResponseDTO response = TimeSlotResponseDTO.builder()
            .id(1L)
            .calendarId(TEST_CALENDAR_ID)
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(timeSlotService.createTimeSlot(any(Member.class), any(TimeSlotCreateRequestDTO.class)))
            .thenReturn(response);

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.startTime").value("10:00:00"))
            .andExpect(jsonPath("$.endTime").value("11:00:00"))
            .andExpect(jsonPath("$.weekdays[0]").value(0));
    }

    @Test
    @DisplayName("실패: startTime >= endTime이면 400 Bad Request")
    void createTimeSlotFailWhenInvalidTime() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(LocalTime.of(11, 0))
            .endTime(LocalTime.of(10, 0))
            .weekdays(TEST_WEEKDAYS)
            .build();

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: weekdays에 잘못된 값이 있으면 400 Bad Request (음수)")
    void createTimeSlotFailWhenInvalidWeekdaysNegative() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(List.of(-1, 0, 1))
            .build();

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: weekdays에 잘못된 값이 있으면 400 Bad Request (7 이상)")
    void createTimeSlotFailWhenInvalidWeekdaysOverSix() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(List.of(5, 6, 7))
            .build();

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: weekdays가 비어있으면 400 Bad Request")
    void createTimeSlotFailWhenWeekdaysEmpty() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(List.of())
            .build();

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: 겹치는 시간대가 있으면 409 Conflict")
    void createTimeSlotFailWhenOverlapping() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .build();

        when(timeSlotService.createTimeSlot(any(Member.class), any(TimeSlotCreateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.TIMESLOT_OVERLAP));

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.TIMESLOT_OVERLAP.toString()));
    }

    @Test
    @DisplayName("실패: 게스트가 생성 시도하면 403 Forbidden")
    void createTimeSlotFailWhenGuest() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .build();

        when(timeSlotService.createTimeSlot(any(Member.class), any(TimeSlotCreateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.GUEST_ACCESS_DENIED));

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.GUEST_ACCESS_DENIED.toString()));
    }

    @Test
    @DisplayName("실패: 캘린더가 없으면 404 Not Found")
    void createTimeSlotFailWhenCalendarNotFound() throws Exception {
        // given
        TimeSlotCreateRequestDTO request = TimeSlotCreateRequestDTO.builder()
            .startTime(TEST_START_TIME)
            .endTime(TEST_END_TIME)
            .weekdays(TEST_WEEKDAYS)
            .build();

        when(timeSlotService.createTimeSlot(any(Member.class), any(TimeSlotCreateRequestDTO.class)))
            .thenThrow(new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        // when & then
        mockMvc.perform(post("/timeslot/v1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value(ErrorCode.CALENDAR_NOT_FOUND.toString()));
    }

    @Test
    @DisplayName("성공: 타임슬롯 목록 조회 시 200 OK 반환")
    void getTimeSlotsSuccess() throws Exception {
        // given
        TimeSlotResponseDTO response1 = TimeSlotResponseDTO.builder()
            .id(1L)
            .calendarId(TEST_CALENDAR_ID)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .weekdays(List.of(0))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        TimeSlotResponseDTO response2 = TimeSlotResponseDTO.builder()
            .id(2L)
            .calendarId(TEST_CALENDAR_ID)
            .startTime(LocalTime.of(14, 0))
            .endTime(LocalTime.of(15, 0))
            .weekdays(List.of(1))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(timeSlotService.getTimeSlotsByHost(any(Member.class)))
            .thenReturn(List.of(response1, response2));

        // when & then
        mockMvc.perform(get("/timeslot/v1")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[1].id").value(2));
    }
}
