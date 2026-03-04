package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.booking.entity.GuestNoShowHistory;

@ExtendWith(MockitoExtension.class)
class GuestNoShowHistoryTest {

    private static final UUID TEST_GUEST_ID = UUID.randomUUID();
    private static final UUID TEST_REPORTER_ID = UUID.randomUUID();
    private static final String TEST_REASON = "게스트가 미팅에 나타나지 않았습니다.";

    @Mock
    private Booking booking;

    @Test
    @DisplayName("성공: GuestNoShowHistory를 생성할 수 있다")
    void createGuestNoShowHistorySuccess() {
        // when
        GuestNoShowHistory history = GuestNoShowHistory.create(
            booking, TEST_GUEST_ID, TEST_REPORTER_ID, TEST_REASON
        );

        // then
        assertThat(history.getBooking()).isEqualTo(booking);
        assertThat(history.getGuestId()).isEqualTo(TEST_GUEST_ID);
        assertThat(history.getReportedBy()).isEqualTo(TEST_REPORTER_ID);
        assertThat(history.getReason()).isEqualTo(TEST_REASON);
    }

    @Test
    @DisplayName("실패: booking이 null이면 예외 발생")
    void createFailsWhenBookingIsNull() {
        assertThatThrownBy(() -> GuestNoShowHistory.create(null, TEST_GUEST_ID, TEST_REPORTER_ID, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("실패: guestId가 null이면 예외 발생")
    void createFailsWhenGuestIdIsNull() {
        assertThatThrownBy(() -> GuestNoShowHistory.create(booking, null, TEST_REPORTER_ID, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("실패: reportedBy가 null이면 예외 발생")
    void createFailsWhenReportedByIsNull() {
        assertThatThrownBy(() -> GuestNoShowHistory.create(booking, TEST_GUEST_ID, null, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }
}
