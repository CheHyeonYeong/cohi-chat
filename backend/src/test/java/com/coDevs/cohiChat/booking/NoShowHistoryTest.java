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
import com.coDevs.cohiChat.booking.entity.NoShowHistory;

@ExtendWith(MockitoExtension.class)
class NoShowHistoryTest {

    private static final UUID TEST_HOST_ID = UUID.randomUUID();
    private static final UUID TEST_REPORTER_ID = UUID.randomUUID();
    private static final String TEST_REASON = "호스트가 미팅에 나타나지 않았습니다.";

    @Mock
    private Booking booking;

    @Test
    @DisplayName("성공: NoShowHistory를 생성할 수 있다")
    void createNoShowHistorySuccess() {
        // when
        NoShowHistory history = NoShowHistory.create(
            booking, TEST_HOST_ID, TEST_REPORTER_ID, TEST_REASON
        );

        // then
        assertThat(history.getBooking()).isEqualTo(booking);
        assertThat(history.getHostId()).isEqualTo(TEST_HOST_ID);
        assertThat(history.getReportedBy()).isEqualTo(TEST_REPORTER_ID);
        assertThat(history.getReason()).isEqualTo(TEST_REASON);
    }

    @Test
    @DisplayName("실패: booking이 null이면 예외 발생")
    void createFailsWhenBookingIsNull() {
        assertThatThrownBy(() -> NoShowHistory.create(null, TEST_HOST_ID, TEST_REPORTER_ID, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("실패: hostId가 null이면 예외 발생")
    void createFailsWhenHostIdIsNull() {
        assertThatThrownBy(() -> NoShowHistory.create(booking, null, TEST_REPORTER_ID, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("실패: reportedBy가 null이면 예외 발생")
    void createFailsWhenReportedByIsNull() {
        assertThatThrownBy(() -> NoShowHistory.create(booking, TEST_HOST_ID, null, TEST_REASON))
            .isInstanceOf(NullPointerException.class);
    }
}
