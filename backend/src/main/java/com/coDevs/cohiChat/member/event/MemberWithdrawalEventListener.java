package com.coDevs.cohiChat.member.event;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.google.calendar.GoogleCalendarService;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회원 탈퇴 이벤트 리스너.
 * 트랜잭션 커밋 후 Google Calendar 이벤트를 삭제하여
 * DB와 외부 API 간 일관성을 보장.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemberWithdrawalEventListener {

    private final CalendarRepository calendarRepository;
    private final GoogleCalendarService googleCalendarService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberWithdrawal(MemberWithdrawalEvent event) {
        // 호스트인 경우: 호스트 캘린더 한 번만 조회하여 재사용
        if (event.getMemberRole() == Role.HOST) {
            Calendar hostCalendar = calendarRepository.findById(event.getMemberId()).orElse(null);
            if (hostCalendar != null) {
                for (Booking booking : event.getHostBookings()) {
                    deleteGoogleCalendarEventSafely(booking, hostCalendar.getGoogleCalendarId());
                }
            }
        }

        // 게스트 예약: 각 호스트의 캘린더에서 이벤트 삭제
        for (Booking booking : event.getGuestBookings()) {
            UUID hostId = booking.getTimeSlot().getUserId();
            calendarRepository.findById(hostId).ifPresent(calendar ->
                deleteGoogleCalendarEventSafely(booking, calendar.getGoogleCalendarId())
            );
        }
    }

    /**
     * 예외를 격리하여 Google Calendar 이벤트 삭제를 시도.
     * 한 건의 실패가 나머지 삭제 작업을 차단하지 않도록 함.
     */
    private void deleteGoogleCalendarEventSafely(Booking booking, String googleCalendarId) {
        try {
            deleteGoogleCalendarEvent(booking, googleCalendarId);
        } catch (Exception e) {
            log.error("Google Calendar 이벤트 삭제 실패 - 수동 확인 필요. bookingId: {}, eventId: {}, error: {}",
                booking.getId(), booking.getGoogleEventId(), e.getMessage(), e);
        }
    }

    private void deleteGoogleCalendarEvent(Booking booking, String googleCalendarId) {
        if (booking.getGoogleEventId() == null) {
            return;
        }

        boolean deleted = googleCalendarService.deleteEvent(
            booking.getGoogleEventId(),
            googleCalendarId
        );

        if (deleted) {
            log.info("Google Calendar event deleted for booking: {}", booking.getId());
        } else {
            log.warn("Failed to delete Google Calendar event for booking: {}, eventId: {}",
                booking.getId(), booking.getGoogleEventId());
        }
    }
}
