package com.coDevs.cohiChat.global.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

/**
 * 시간 변환 유틸리티.
 * 서버는 UTC 기준으로 Instant를 반환하고, FE에서 브라우저 타임존으로 변환.
 */
public final class TimeUtils {

    private TimeUtils() {
    }

    /**
     * LocalDate + LocalTime을 UTC 기준 Instant로 변환.
     * DB에 저장된 시간은 UTC 기준이어야 함.
     */
    public static Instant toUtcInstant(LocalDate date, LocalTime time) {
        return date.atTime(time).toInstant(ZoneOffset.UTC);
    }
}
