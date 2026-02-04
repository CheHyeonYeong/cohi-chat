package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BookingRepositoryTest {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    private UUID guestId;
    private TimeSlot savedTimeSlot;
    private Booking savedBooking;

    @BeforeEach
    void setUp() {
        guestId = UUID.randomUUID();
        UUID hostId = UUID.randomUUID();

        TimeSlot timeSlot = TimeSlot.create(
            hostId,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            List.of(0, 1, 2) // 월, 화, 수
        );
        savedTimeSlot = timeSlotRepository.save(timeSlot);

        Booking booking = Booking.create(
            savedTimeSlot,
            guestId,
            LocalDate.of(2025, 1, 20),
            "프로젝트 상담",
            "Spring Boot 프로젝트 관련 질문"
        );
        savedBooking = bookingRepository.save(booking);
    }

    @Test
    @DisplayName("성공: Booking 저장 및 조회")
    void saveAndFindBooking() {
        // when
        var found = bookingRepository.findById(savedBooking.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getTimeSlot().getId()).isEqualTo(savedTimeSlot.getId());
        assertThat(found.get().getGuestId()).isEqualTo(guestId);
        assertThat(found.get().getBookingDate()).isEqualTo(LocalDate.of(2025, 1, 20));
        assertThat(found.get().getTopic()).isEqualTo("프로젝트 상담");
    }

    @Test
    @DisplayName("성공: 특정 날짜와 타임슬롯에 취소되지 않은 예약이 존재하는지 확인")
    void existsDuplicateBookingTrue() {
        // when
        boolean exists = bookingRepository.existsDuplicateBooking(
            savedTimeSlot,
            LocalDate.of(2025, 1, 20),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        // then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("성공: 다른 날짜에는 예약이 존재하지 않음")
    void existsDuplicateBookingFalseDifferentDate() {
        // when
        boolean exists = bookingRepository.existsDuplicateBooking(
            savedTimeSlot,
            LocalDate.of(2025, 1, 21),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        // then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("성공: 다른 타임슬롯에는 예약이 존재하지 않음")
    void existsDuplicateBookingFalseDifferentTimeSlot() {
        // given
        TimeSlot anotherTimeSlot = TimeSlot.create(
            UUID.randomUUID(),
            java.time.LocalTime.of(14, 0),
            java.time.LocalTime.of(15, 0),
            List.of(0, 1, 2)
        );
        TimeSlot savedAnotherTimeSlot = timeSlotRepository.save(anotherTimeSlot);

        // when
        boolean exists = bookingRepository.existsDuplicateBooking(
            savedAnotherTimeSlot,
            LocalDate.of(2025, 1, 20),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        // then
        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("성공: 자신을 제외하면 중복 예약이 없음")
    void existsDuplicateBookingFalseWhenExcludingSelf() {
        // when
        boolean exists = bookingRepository.existsDuplicateBooking(
            savedTimeSlot,
            LocalDate.of(2025, 1, 20),
            AttendanceStatus.getCancelledStatuses(),
            savedBooking.getId()
        );

        // then
        assertThat(exists).isFalse();
    }
}
