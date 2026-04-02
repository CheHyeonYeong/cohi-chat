package com.coDevs.cohiChat.global.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * 시간 변환 유틸리티.
 * 서버는 UTC 기준으로 Instant를 반환하고, FE에서 브라우저 타임존으로 변환.
 */
public final class TimeUtils {

    private TimeUtils() {
    }

    /**
     * LocalDate + LocalTime을 지정된 타임존 기준으로 Instant 변환.
     * DB에 저장된 시간은 서비스 타임존(예: Asia/Seoul) 기준이므로,
     * 해당 타임존을 적용하여 올바른 UTC Instant를 생성.
     */
    public static Instant toUtcInstant(LocalDate date, LocalTime time, ZoneId zoneId) {
        return date.atTime(time).atZone(zoneId).toInstant();
    }
}
