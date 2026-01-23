package com.coDevs.cohiChat.booking.entity;

import java.util.List;

/**
 * 예약 참석 상태
 * - SCHEDULED: 예정
 * - ATTENDED: 참석
 * - NO_SHOW: 노쇼
 * - CANCELLED: 취소
 * - SAME_DAY_CANCEL: 당일 취소
 * - LATE: 지각
 */
public enum AttendanceStatus {
    SCHEDULED,
    ATTENDED,
    NO_SHOW,
    CANCELLED,
    SAME_DAY_CANCEL,
    LATE;

    /**
     * 취소된 상태 목록 반환
     * 취소된 예약은 중복 예약 체크에서 제외됨
     */
    public static List<AttendanceStatus> getCancelledStatuses() {
        return List.of(CANCELLED, SAME_DAY_CANCEL);
    }

    /**
     * 호스트가 설정 가능한 상태인지 확인
     * 호스트는 출석(ATTENDED), 노쇼(NO_SHOW), 지각(LATE)만 설정 가능
     */
    public boolean isHostSettable() {
        return this == ATTENDED || this == NO_SHOW || this == LATE;
    }

    /**
     * 취소 가능한 상태인지 확인
     * 예정(SCHEDULED) 상태만 취소 가능
     */
    public boolean isCancellable() {
        return this == SCHEDULED;
    }

    /**
     * 호스트가 상태 변경 가능한 상태인지 확인
     * 예정(SCHEDULED) 상태만 변경 가능
     */
    public boolean isModifiable() {
        return this == SCHEDULED;
    }
}
