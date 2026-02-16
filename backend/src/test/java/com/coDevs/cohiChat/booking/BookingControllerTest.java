package com.coDevs.cohiChat.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.booking.controller.BookingController;
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

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.booking.response.NoShowHistoryResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(BookingController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "guest")
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private Member mockMember;

    @BeforeEach
    void setUp() {
        mockMember = mock(Member.class);
        given(mockMember.getId()).willReturn(GUEST_ID);
        given(mockMember.getRole()).willReturn(Role.GUEST);
        given(memberService.getMember(any())).willReturn(mockMember);
    }

    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final Long TIME_SLOT_ID = 1L;
    private static final LocalDate FUTURE_DATE = LocalDate.now().plusDays(7);

    @Test
    @DisplayName("성공: 예약 생성 - 201 Created")
    void createBookingSuccess() throws Exception {
        // given
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(1L)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(GUEST_ID)
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.createBooking(any(Member.class), any())).willReturn(response);

        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "%s",
                "topic": "프로젝트 상담",
                "description": "Spring Boot 프로젝트 관련 질문"
            }
            """.formatted(FUTURE_DATE);

        // when & then
        mockMvc.perform(post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$.data.topic").value("프로젝트 상담"))
            .andExpect(jsonPath("$.data.attendanceStatus").value("SCHEDULED"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("실패: 자기 자신 예약 - 422")
    void createBookingFailSelfBooking() throws Exception {
        // given
        given(bookingService.createBooking(any(Member.class), any()))
            .willThrow(new CustomException(ErrorCode.SELF_BOOKING));

        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "%s",
                "topic": "프로젝트 상담",
                "description": "Spring Boot 프로젝트 관련 질문"
            }
            """.formatted(FUTURE_DATE);

        // when & then
        mockMvc.perform(post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 과거 날짜 예약 - 400 (DTO 검증에서 @FutureOrPresent로 거부)")
    void createBookingFailPastBooking() throws Exception {
        // given - @FutureOrPresent 검증으로 인해 서비스 호출 전에 거부됨
        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "2020-01-01",
                "topic": "프로젝트 상담",
                "description": "Spring Boot 프로젝트 관련 질문"
            }
            """;

        // when & then
        mockMvc.perform(post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("실패: 중복 예약 - 409")
    void createBookingFailAlreadyExists() throws Exception {
        // given
        given(bookingService.createBooking(any(Member.class), any()))
            .willThrow(new CustomException(ErrorCode.BOOKING_ALREADY_EXISTS));

        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "%s",
                "topic": "프로젝트 상담",
                "description": "Spring Boot 프로젝트 관련 질문"
            }
            """.formatted(FUTURE_DATE);

        // when & then
        mockMvc.perform(post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 타임슬롯 없음 - 404")
    void createBookingFailTimeSlotNotFound() throws Exception {
        // given
        given(bookingService.createBooking(any(Member.class), any()))
            .willThrow(new CustomException(ErrorCode.TIMESLOT_NOT_FOUND));

        String requestBody = """
            {
                "timeSlotId": 999,
                "when": "%s",
                "topic": "프로젝트 상담",
                "description": "Spring Boot 프로젝트 관련 질문"
            }
            """.formatted(FUTURE_DATE);

        // when & then
        mockMvc.perform(post("/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("성공: 예약 상세 조회 - 200 OK")
    void getBookingByIdSuccess() throws Exception {
        // given
        Long bookingId = 1L;
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(bookingId)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(GUEST_ID)
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.getBookingById(eq(bookingId), eq(GUEST_ID))).willReturn(response);

        // when & then
        mockMvc.perform(get("/bookings/{bookingId}", bookingId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(bookingId))
            .andExpect(jsonPath("$.data.timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$.data.topic").value("프로젝트 상담"))
            .andExpect(jsonPath("$.data.attendanceStatus").value("SCHEDULED"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 조회 - 404")
    void getBookingByIdFailNotFound() throws Exception {
        // given
        Long bookingId = 999L;
        given(bookingService.getBookingById(eq(bookingId), eq(GUEST_ID)))
            .willThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/bookings/{bookingId}", bookingId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 권한 없는 예약 조회 - 403 Forbidden")
    void getBookingByIdFailAccessDenied() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.getBookingById(eq(bookingId), eq(GUEST_ID)))
            .willThrow(new CustomException(ErrorCode.ACCESS_DENIED));

        // when & then
        mockMvc.perform(get("/bookings/{bookingId}", bookingId))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("성공: 내 예약 조회 (게스트) - 200 OK")
    void getMyBookingsAsGuestSuccess() throws Exception {
        // given
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(1L)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(GUEST_ID)
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.getBookingsByGuestId(GUEST_ID)).willReturn(List.of(response));

        // when & then
        mockMvc.perform(get("/bookings/guest/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$.data[0].topic").value("프로젝트 상담"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("성공: 내 예약 조회 (호스트) - 200 OK")
    void getMyBookingsAsHostSuccess() throws Exception {
        // given
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(2L)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(UUID.randomUUID())
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(14, 0))
            .endTime(LocalTime.of(15, 0))
            .topic("기술 면접")
            .description("백엔드 개발자 면접")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.getBookingsByHostId(GUEST_ID)).willReturn(List.of(response));

        // when & then
        mockMvc.perform(get("/bookings/host/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].id").value(2))
            .andExpect(jsonPath("$.data[0].topic").value("기술 면접"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @WithMockUser(username = "guest")
    @DisplayName("성공: 인증된 사용자는 본인 예약만 조회 가능")
    void getMyBookingsOnlyReturnsOwnBookings() throws Exception {
        // given - 인증된 사용자의 ID로만 조회됨
        given(bookingService.getBookingsByGuestId(GUEST_ID)).willReturn(List.of());

        // when
        mockMvc.perform(get("/bookings/guest/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray());

        // then - 인증된 사용자의 ID로 서비스가 호출되었는지 검증
        verify(bookingService).getBookingsByGuestId(GUEST_ID);
    }

    // ===== 예약 일정 수정 테스트 (Issue #59) =====

    @Test
    @DisplayName("성공: 예약 일정 수정 - 200 OK")
    void updateBookingScheduleSuccess() throws Exception {
        // given
        Long bookingId = 1L;
        LocalDate newDate = FUTURE_DATE.plusDays(7);
        Long newTimeSlotId = 2L;

        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(bookingId)
            .timeSlotId(newTimeSlotId)
            .guestId(UUID.randomUUID())
            .bookingDate(newDate)
            .startTime(LocalTime.of(14, 0))
            .endTime(LocalTime.of(15, 0))
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.updateBookingSchedule(eq(bookingId), eq(GUEST_ID), any())).willReturn(response);

        String requestBody = """
            {
                "timeSlotId": %d,
                "when": "%s"
            }
            """.formatted(newTimeSlotId, newDate);

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/schedule", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(bookingId))
            .andExpect(jsonPath("$.data.timeSlotId").value(newTimeSlotId))
            .andExpect(jsonPath("$.data.when").value(newDate.toString()))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("실패: 권한 없는 사용자의 예약 수정 시도 - 403 Forbidden")
    void updateBookingScheduleFailAccessDenied() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.updateBookingSchedule(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.ACCESS_DENIED));

        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "%s"
            }
            """.formatted(FUTURE_DATE.plusDays(7));

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/schedule", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 수정 시도 - 404 Not Found")
    void updateBookingScheduleFailNotFound() throws Exception {
        // given
        Long bookingId = 999L;
        given(bookingService.updateBookingSchedule(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "%s"
            }
            """.formatted(FUTURE_DATE.plusDays(7));

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/schedule", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 과거 날짜로 예약 수정 시도 - 400 Bad Request")
    void updateBookingScheduleFailPastDate() throws Exception {
        // given - @FutureOrPresent 검증으로 인해 서비스 호출 전에 거부됨
        Long bookingId = 1L;
        String requestBody = """
            {
                "timeSlotId": 1,
                "when": "2020-01-01"
            }
            """;

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/schedule", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.message").exists());
    }

    // ===== 예약 상태 변경 테스트 (Issue #61) =====

    @Test
    @DisplayName("성공: 예약 상태 변경 - 200 OK")
    void updateBookingStatusSuccess() throws Exception {
        // given
        Long bookingId = 1L;
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(bookingId)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(UUID.randomUUID())
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .topic("프로젝트 상담")
            .description("Spring Boot 프로젝트 관련 질문")
            .attendanceStatus(AttendanceStatus.ATTENDED)
            .createdAt(Instant.now())
            .build();

        given(bookingService.updateBookingStatus(eq(bookingId), eq(GUEST_ID), any())).willReturn(response);

        String requestBody = """
            {
                "status": "ATTENDED"
            }
            """;

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/status", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(bookingId))
            .andExpect(jsonPath("$.data.attendanceStatus").value("ATTENDED"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("실패: 권한 없는 사용자의 상태 변경 시도 - 403 Forbidden")
    void updateBookingStatusFailAccessDenied() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.updateBookingStatus(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.ACCESS_DENIED));

        String requestBody = """
            {
                "status": "ATTENDED"
            }
            """;

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/status", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 상태 변경 시도 - 404 Not Found")
    void updateBookingStatusFailNotFound() throws Exception {
        // given
        Long bookingId = 999L;
        given(bookingService.updateBookingStatus(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        String requestBody = """
            {
                "status": "ATTENDED"
            }
            """;

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/status", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 상태 변경 불가능한 예약 - 422 Unprocessable Entity")
    void updateBookingStatusFailNotModifiable() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.updateBookingStatus(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.BOOKING_NOT_MODIFIABLE));

        String requestBody = """
            {
                "status": "ATTENDED"
            }
            """;

        // when & then
        mockMvc.perform(patch("/bookings/{bookingId}/status", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    // ===== 예약 취소 테스트 (Issue #61) =====

    @Test
    @DisplayName("성공: 예약 취소 - 204 No Content")
    void cancelBookingSuccess() throws Exception {
        // given
        Long bookingId = 1L;
        doNothing().when(bookingService).cancelBooking(eq(bookingId), eq(GUEST_ID));

        // when & then
        mockMvc.perform(delete("/bookings/{bookingId}", bookingId)
                .with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("실패: 권한 없는 사용자의 예약 취소 시도 - 403 Forbidden")
    void cancelBookingFailAccessDenied() throws Exception {
        // given
        Long bookingId = 1L;
        doThrow(new CustomException(ErrorCode.ACCESS_DENIED))
            .when(bookingService).cancelBooking(eq(bookingId), eq(GUEST_ID));

        // when & then
        mockMvc.perform(delete("/bookings/{bookingId}", bookingId)
                .with(csrf()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 취소 시도 - 404 Not Found")
    void cancelBookingFailNotFound() throws Exception {
        // given
        Long bookingId = 999L;
        doThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND))
            .when(bookingService).cancelBooking(eq(bookingId), eq(GUEST_ID));

        // when & then
        mockMvc.perform(delete("/bookings/{bookingId}", bookingId)
                .with(csrf()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 취소 불가능한 예약 취소 시도 - 422 Unprocessable Entity")
    void cancelBookingFailNotCancellable() throws Exception {
        // given
        Long bookingId = 1L;
        doThrow(new CustomException(ErrorCode.BOOKING_NOT_CANCELLABLE))
            .when(bookingService).cancelBooking(eq(bookingId), eq(GUEST_ID));

        // when & then
        mockMvc.perform(delete("/bookings/{bookingId}", bookingId)
                .with(csrf()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    // ===== 호스트 노쇼 신고 테스트 (Issue #195) =====

    @Test
    @DisplayName("성공: 호스트 노쇼 신고 - 200 OK")
    void reportHostNoShowSuccess() throws Exception {
        // given
        Long bookingId = 1L;
        BookingResponseDTO response = BookingResponseDTO.builder()
            .id(bookingId)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(GUEST_ID)
            .bookingDate(FUTURE_DATE)
            .startTime(LocalTime.of(10, 0))
            .endTime(LocalTime.of(11, 0))
            .topic("프로젝트 상담")
            .description("설명")
            .attendanceStatus(AttendanceStatus.HOST_NO_SHOW)
            .createdAt(Instant.now())
            .build();

        given(bookingService.reportHostNoShow(eq(bookingId), eq(GUEST_ID), any())).willReturn(response);

        String requestBody = """
            {
                "reason": "호스트가 나타나지 않았습니다."
            }
            """;

        // when & then
        mockMvc.perform(post("/bookings/{bookingId}/report-noshow", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.attendanceStatus").value("HOST_NO_SHOW"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("실패: 미팅 시작 전 노쇼 신고 - 422")
    void reportHostNoShowFailMeetingNotStarted() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.reportHostNoShow(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.MEETING_NOT_STARTED));

        String requestBody = """
            {
                "reason": "사유"
            }
            """;

        // when & then
        mockMvc.perform(post("/bookings/{bookingId}/report-noshow", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    @Test
    @DisplayName("실패: 이미 신고된 예약 재신고 - 409")
    void reportHostNoShowFailAlreadyReported() throws Exception {
        // given
        Long bookingId = 1L;
        given(bookingService.reportHostNoShow(eq(bookingId), eq(GUEST_ID), any()))
            .willThrow(new CustomException(ErrorCode.NOSHOW_ALREADY_REPORTED));

        String requestBody = """
            {
                "reason": "사유"
            }
            """;

        // when & then
        mockMvc.perform(post("/bookings/{bookingId}/report-noshow", bookingId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").exists());
    }

    // ===== 호스트 노쇼 이력 조회 테스트 (Issue #195) =====

    @Test
    @DisplayName("성공: 호스트 노쇼 이력 조회 - 200 OK")
    void getNoShowHistorySuccess() throws Exception {
        // given
        UUID hostId = UUID.randomUUID();
        NoShowHistoryResponseDTO response = NoShowHistoryResponseDTO.builder()
            .id(1L)
            .bookingId(10L)
            .hostId(hostId)
            .reportedBy(GUEST_ID)
            .reason("사유")
            .bookingDate(FUTURE_DATE)
            .bookingTopic("상담")
            .build();

        given(bookingService.getNoShowHistoryByHostId(eq(hostId))).willReturn(List.of(response));

        // when & then
        mockMvc.perform(get("/bookings/host/{hostId}/noshow-history", hostId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].bookingId").value(10))
            .andExpect(jsonPath("$.data[0].reason").value("사유"))
            .andExpect(jsonPath("$.error").isEmpty());
    }

    @Test
    @DisplayName("성공: 노쇼 이력 없으면 빈 목록 - 200 OK")
    void getNoShowHistoryEmptyList() throws Exception {
        // given
        UUID hostId = UUID.randomUUID();
        given(bookingService.getNoShowHistoryByHostId(eq(hostId))).willReturn(List.of());

        // when & then
        mockMvc.perform(get("/bookings/host/{hostId}/noshow-history", hostId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data").isEmpty());
    }

}
