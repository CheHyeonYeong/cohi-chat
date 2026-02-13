package com.coDevs.cohiChat.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;

class AttendanceStatusTest {

    @Test
    @DisplayName("AttendanceStatus Enum에는 7가지 상태가 있어야 한다")
    void shouldHaveSevenStatuses() {
        AttendanceStatus[] statuses = AttendanceStatus.values();

        assertThat(statuses).hasSize(7);
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

    @Test
    @DisplayName("HOST_NO_SHOW 상태가 존재해야 한다")
    void shouldHaveHostNoShowStatus() {
        assertThat(AttendanceStatus.valueOf("HOST_NO_SHOW")).isEqualTo(AttendanceStatus.HOST_NO_SHOW);
    }

    @Test
    @DisplayName("SCHEDULED 상태만 게스트 노쇼 신고가 가능하다")
    void onlyScheduledIsGuestReportable() {
        assertThat(AttendanceStatus.SCHEDULED.isGuestReportable()).isTrue();
        assertThat(AttendanceStatus.ATTENDED.isGuestReportable()).isFalse();
        assertThat(AttendanceStatus.NO_SHOW.isGuestReportable()).isFalse();
        assertThat(AttendanceStatus.HOST_NO_SHOW.isGuestReportable()).isFalse();
        assertThat(AttendanceStatus.CANCELLED.isGuestReportable()).isFalse();
        assertThat(AttendanceStatus.SAME_DAY_CANCEL.isGuestReportable()).isFalse();
        assertThat(AttendanceStatus.LATE.isGuestReportable()).isFalse();
    }

    @Test
    @DisplayName("HOST_NO_SHOW는 호스트가 설정할 수 없는 상태이다")
    void hostNoShowIsNotHostSettable() {
        assertThat(AttendanceStatus.HOST_NO_SHOW.isHostSettable()).isFalse();
    }

    @Test
    @DisplayName("getExcludedFromDuplicateCheck는 CANCELLED, SAME_DAY_CANCEL, HOST_NO_SHOW를 반환해야 한다")
    void getExcludedFromDuplicateCheckShouldReturnThreeStatuses() {
        List<AttendanceStatus> excluded = AttendanceStatus.getExcludedFromDuplicateCheck();

        assertThat(excluded).containsExactlyInAnyOrder(
            AttendanceStatus.CANCELLED,
            AttendanceStatus.SAME_DAY_CANCEL,
            AttendanceStatus.HOST_NO_SHOW
        );
    }
}
