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
            List.of(0, 1, 2)
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
    @DisplayName("성공: Booking 저장 후 조회")
    void saveAndFindBooking() {
        var found = bookingRepository.findById(savedBooking.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getTimeSlot().getId()).isEqualTo(savedTimeSlot.getId());
        assertThat(found.get().getGuestId()).isEqualTo(guestId);
        assertThat(found.get().getBookingDate()).isEqualTo(LocalDate.of(2025, 1, 20));
        assertThat(found.get().getTopic()).isEqualTo("프로젝트 상담");
        assertThat(found.get().getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(found.get().getEndTime()).isEqualTo(LocalTime.of(11, 0));
    }

    @Test
    @DisplayName("성공: 같은 호스트의 같은 날짜에 시간이 겹치면 중복 예약으로 본다")
    void existsOverlappingBookingTrue() {
        boolean exists = bookingRepository.existsOverlappingBooking(
            savedTimeSlot.getUserId(),
            LocalDate.of(2025, 1, 20),
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("성공: 다른 날짜에는 겹치는 예약이 없다")
    void existsOverlappingBookingFalseDifferentDate() {
        boolean exists = bookingRepository.existsOverlappingBooking(
            savedTimeSlot.getUserId(),
            LocalDate.of(2025, 1, 21),
            LocalTime.of(10, 30),
            LocalTime.of(11, 30),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("성공: 같은 호스트라도 시간이 겹치지 않으면 중복 예약이 아니다")
    void existsOverlappingBookingFalseWhenTimeDoesNotOverlap() {
        TimeSlot anotherTimeSlot = TimeSlot.create(
            savedTimeSlot.getUserId(),
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            List.of(0, 1, 2)
        );
        timeSlotRepository.save(anotherTimeSlot);

        boolean exists = bookingRepository.existsOverlappingBooking(
            savedTimeSlot.getUserId(),
            LocalDate.of(2025, 1, 20),
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            AttendanceStatus.getCancelledStatuses(),
            null
        );

        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("성공: 자신을 제외하면 겹치는 예약이 없다")
    void existsOverlappingBookingFalseWhenExcludingSelf() {
        boolean exists = bookingRepository.existsOverlappingBooking(
            savedTimeSlot.getUserId(),
            LocalDate.of(2025, 1, 20),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            AttendanceStatus.getCancelledStatuses(),
            savedBooking.getId()
        );

        assertThat(exists).isFalse();
    }
}
