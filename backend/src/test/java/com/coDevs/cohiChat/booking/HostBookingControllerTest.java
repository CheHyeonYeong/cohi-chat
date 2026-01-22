package com.coDevs.cohiChat.booking;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;

@WebMvcTest(HostBookingController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "host")
class HostBookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private static final UUID HOST_ID = UUID.randomUUID();
    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final Long TIME_SLOT_ID = 1L;
    private static final LocalDate FUTURE_DATE = LocalDate.now().plusDays(7);

    @Test
    @DisplayName("성공: 호스트 예약 목록 조회 - 200 OK")
    void getBookingsByHostIdSuccess() throws Exception {
        // given
        BookingResponseDTO response1 = BookingResponseDTO.builder()
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

        BookingResponseDTO response2 = BookingResponseDTO.builder()
            .id(2L)
            .timeSlotId(TIME_SLOT_ID)
            .guestId(GUEST_ID)
            .bookingDate(FUTURE_DATE.plusDays(1))
            .startTime(LocalTime.of(14, 0))
            .endTime(LocalTime.of(15, 0))
            .topic("코드 리뷰")
            .description("리팩토링 관련 질문")
            .attendanceStatus(AttendanceStatus.SCHEDULED)
            .createdAt(LocalDateTime.now())
            .build();

        given(bookingService.getBookingsByHostId(HOST_ID))
            .willReturn(List.of(response2, response1));

        // when & then
        mockMvc.perform(get("/api/hosts/{hostId}/bookings", HOST_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(2))
            .andExpect(jsonPath("$[1].id").value(1));
    }

    @Test
    @DisplayName("성공: 호스트 예약이 없으면 빈 목록 반환 - 200 OK")
    void getBookingsByHostIdEmptyList() throws Exception {
        // given
        given(bookingService.getBookingsByHostId(HOST_ID))
            .willReturn(List.of());

        // when & then
        mockMvc.perform(get("/api/hosts/{hostId}/bookings", HOST_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }
}
