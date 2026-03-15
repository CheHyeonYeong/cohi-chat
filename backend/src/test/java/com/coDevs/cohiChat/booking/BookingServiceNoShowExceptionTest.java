package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.NoShowHistory;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarProperties;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarService;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.coDevs.cohiChat.member.MemberRepository;

import jakarta.persistence.EntityManager;

@ExtendWith(MockitoExtension.class)
class BookingServiceNoShowExceptionTest {

    private static final UUID GUEST_ID = UUID.randomUUID();
    private static final UUID HOST_ID = UUID.randomUUID();

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TimeSlotRepository timeSlotRepository;

    @Mock
    private CalendarRepository calendarRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private NoShowHistoryRepository noShowHistoryRepository;

    @Mock
    private GoogleCalendarService googleCalendarService;

    @Mock
    private GoogleCalendarProperties googleCalendarProperties;

    @Mock
    private EntityManager entityManager;

    @Mock
    private TimeSlot timeSlot;

    @InjectMocks
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        given(googleCalendarProperties.getTimezone()).willReturn("Asia/Seoul");
        bookingService.initZoneId();
    }

    @Test
    @DisplayName("reportHostNoShow rethrows unrelated integrity violations")
    void reportHostNoShowRethrowsOtherIntegrityViolations() {
        Long bookingId = 1L;
        Booking booking = Booking.create(timeSlot, GUEST_ID, LocalDate.now().minusDays(1), "topic", "desc");
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
            "foreign key violation",
            new ConstraintViolationException(
                "foreign key violation",
                new SQLException("fk violation"),
                "fk_noshow_history_host_id"
            )
        );

        given(timeSlot.getUserId()).willReturn(HOST_ID);
        given(timeSlot.getStartTime()).willReturn(LocalTime.of(10, 0));
        given(bookingRepository.findByIdWithTimeSlot(bookingId)).willReturn(Optional.of(booking));
        given(noShowHistoryRepository.save(any(NoShowHistory.class))).willThrow(exception);

        assertThatThrownBy(() -> bookingService.reportHostNoShow(bookingId, GUEST_ID, "reason"))
            .isSameAs(exception);
    }
}
