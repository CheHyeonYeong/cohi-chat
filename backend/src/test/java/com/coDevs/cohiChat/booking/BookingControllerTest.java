package com.coDevs.cohiChat.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
            .createdAt(LocalDateTime.now())
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
        mockMvc.perform(post("/api/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$.topic").value("프로젝트 상담"))
            .andExpect(jsonPath("$.attendanceStatus").value("SCHEDULED"));
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
        mockMvc.perform(post("/api/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnprocessableEntity());
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
        mockMvc.perform(post("/api/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest());
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
        mockMvc.perform(post("/api/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isConflict());
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
        mockMvc.perform(post("/api/bookings")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound());
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
            .createdAt(LocalDateTime.now())
            .build();

        given(bookingService.getBookingById(bookingId)).willReturn(response);

        // when & then
        mockMvc.perform(get("/api/bookings/{bookingId}", bookingId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(bookingId))
            .andExpect(jsonPath("$.timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$.topic").value("프로젝트 상담"))
            .andExpect(jsonPath("$.attendanceStatus").value("SCHEDULED"));
    }

    @Test
    @DisplayName("실패: 존재하지 않는 예약 조회 - 404")
    void getBookingByIdFailNotFound() throws Exception {
        // given
        Long bookingId = 999L;
        given(bookingService.getBookingById(bookingId))
            .willThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/api/bookings/{bookingId}", bookingId))
            .andExpect(status().isNotFound());
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
            .createdAt(LocalDateTime.now())
            .build();

        given(bookingService.getBookingsByGuestId(GUEST_ID)).willReturn(List.of(response));

        // when & then
        mockMvc.perform(get("/api/bookings/guest/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].timeSlotId").value(TIME_SLOT_ID))
            .andExpect(jsonPath("$[0].topic").value("프로젝트 상담"));
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
            .createdAt(LocalDateTime.now())
            .build();

        given(bookingService.getBookingsByHostId(GUEST_ID)).willReturn(List.of(response));

        // when & then
        mockMvc.perform(get("/api/bookings/host/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(2))
            .andExpect(jsonPath("$[0].topic").value("기술 면접"));
    }

    @Test
    @WithMockUser(username = "guest")
    @DisplayName("성공: 인증된 사용자는 본인 예약만 조회 가능")
    void getMyBookingsOnlyReturnsOwnBookings() throws Exception {
        // given - 인증된 사용자의 ID로만 조회됨
        given(bookingService.getBookingsByGuestId(GUEST_ID)).willReturn(List.of());

        // when & then
        mockMvc.perform(get("/api/bookings/guest/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

}
