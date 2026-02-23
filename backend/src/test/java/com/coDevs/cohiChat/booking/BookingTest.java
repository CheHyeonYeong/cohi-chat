package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@ExtendWith(MockitoExtension.class)
class BookingTest {

    private static final Long TEST_TIME_SLOT_ID = 1L;
    private static final UUID TEST_GUEST_ID = UUID.randomUUID();
    private static final LocalDate TEST_BOOKING_DATE = LocalDate.of(2025, 1, 20);
    private static final String TEST_TOPIC = "프로젝트 상담";
    private static final String TEST_DESCRIPTION = "Spring Boot 프로젝트 관련 질문";

    @Mock
    private TimeSlot timeSlot;

    @Test
    @DisplayName("성공: Booking 엔티티를 생성할 수 있다")
    void createBookingSuccess() {
        // when
        Booking booking = Booking.create(
            timeSlot,
            TEST_GUEST_ID,
            TEST_BOOKING_DATE,
            TEST_TOPIC,
            TEST_DESCRIPTION
        );

        // then
        assertThat(booking.getTimeSlot()).isEqualTo(timeSlot);
        assertThat(booking.getGuestId()).isEqualTo(TEST_GUEST_ID);
        assertThat(booking.getBookingDate()).isEqualTo(TEST_BOOKING_DATE);
        assertThat(booking.getTopic()).isEqualTo(TEST_TOPIC);
        assertThat(booking.getDescription()).isEqualTo(TEST_DESCRIPTION);
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.SCHEDULED);
        assertThat(booking.getGoogleEventId()).isNull();
    }

    @Test
    @DisplayName("성공: 생성 시 기본 상태는 SCHEDULED이다")
    void defaultStatusIsScheduled() {
        // when
        Booking booking = Booking.create(
            timeSlot,
            TEST_GUEST_ID,
            TEST_BOOKING_DATE,
            TEST_TOPIC,
            TEST_DESCRIPTION
        );

        // then
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.SCHEDULED);
    }

    @Test
    @DisplayName("성공: 호스트 노쇼 신고 시 상태가 HOST_NO_SHOW로 변경되고 신고 시간이 기록된다")
    void reportHostNoShowSuccess() {
        // given
        Booking booking = Booking.create(
            timeSlot, TEST_GUEST_ID, TEST_BOOKING_DATE, TEST_TOPIC, TEST_DESCRIPTION
        );

        // when
        booking.reportHostNoShow(Instant.now());

        // then
        assertThat(booking.getAttendanceStatus()).isEqualTo(AttendanceStatus.HOST_NO_SHOW);
        assertThat(booking.getNoshowReportedAt()).isNotNull();
    }

}
