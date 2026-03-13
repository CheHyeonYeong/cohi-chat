package com.coDevs.cohiChat.global.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 개발 환경용 Rate Limit Service (Redis 없이 동작)
 * Rate limiting을 비활성화하고 항상 허용
 */
@Slf4j
@Service
@Profile("local")
public class LocalRateLimitService implements RateLimitServiceBase {

    @Override
    public long checkRateLimit(String key) {
        // 로컬에서는 rate limiting 비활성화
        log.debug("Rate limit check skipped (local profile) - key: {}", key);
        return Long.MAX_VALUE;
    }
}
