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
}
