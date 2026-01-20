package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;

class AttendanceStatusTest {

    @Test
    @DisplayName("AttendanceStatus Enum에는 6가지 상태가 있어야 한다")
    void shouldHaveSixStatuses() {
        AttendanceStatus[] statuses = AttendanceStatus.values();

        assertThat(statuses).hasSize(6);
    }

    @Test
    @DisplayName("SCHEDULED 상태가 존재해야 한다")
    void shouldHaveScheduledStatus() {
        assertThat(AttendanceStatus.valueOf("SCHEDULED")).isEqualTo(AttendanceStatus.SCHEDULED);
    }

    @Test
    @DisplayName("ATTENDED 상태가 존재해야 한다")
    void shouldHaveAttendedStatus() {
        assertThat(AttendanceStatus.valueOf("ATTENDED")).isEqualTo(AttendanceStatus.ATTENDED);
    }

    @Test
    @DisplayName("NO_SHOW 상태가 존재해야 한다")
    void shouldHaveNoShowStatus() {
        assertThat(AttendanceStatus.valueOf("NO_SHOW")).isEqualTo(AttendanceStatus.NO_SHOW);
    }

    @Test
    @DisplayName("CANCELLED 상태가 존재해야 한다")
    void shouldHaveCancelledStatus() {
        assertThat(AttendanceStatus.valueOf("CANCELLED")).isEqualTo(AttendanceStatus.CANCELLED);
    }

    @Test
    @DisplayName("SAME_DAY_CANCEL 상태가 존재해야 한다")
    void shouldHaveSameDayCancelStatus() {
        assertThat(AttendanceStatus.valueOf("SAME_DAY_CANCEL")).isEqualTo(AttendanceStatus.SAME_DAY_CANCEL);
    }

    @Test
    @DisplayName("LATE 상태가 존재해야 한다")
    void shouldHaveLateStatus() {
        assertThat(AttendanceStatus.valueOf("LATE")).isEqualTo(AttendanceStatus.LATE);
    }

    @Test
    @DisplayName("getCancelledStatuses는 CANCELLED와 SAME_DAY_CANCEL을 반환해야 한다")
    void getCancelledStatusesShouldReturnCancelledAndSameDayCancel() {
        List<AttendanceStatus> cancelled = AttendanceStatus.getCancelledStatuses();

        assertThat(cancelled).containsExactlyInAnyOrder(
            AttendanceStatus.CANCELLED,
            AttendanceStatus.SAME_DAY_CANCEL
        );
    }
}
