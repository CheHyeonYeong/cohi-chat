package com.coDevs.cohiChat.global.config;

/**
 * Rate Limiting 서비스 인터페이스
 */
public interface RateLimitServiceBase {
    /**
     * Rate limit 체크
     * @param key 체크할 키
     * @return 남은 토큰 수
     */
    long checkRateLimit(String key);
}
