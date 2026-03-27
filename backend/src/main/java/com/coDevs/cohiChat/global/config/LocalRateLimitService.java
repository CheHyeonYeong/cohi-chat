package com.coDevs.cohiChat.global.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Profile("local")
public class LocalRateLimitService implements RateLimitServiceBase {

    @Override
    public long checkRateLimit(String key) {
        log.debug("[rateLimit] [SKIP] reason=LOCAL_PROFILE");
        return Long.MAX_VALUE;
    }
}
