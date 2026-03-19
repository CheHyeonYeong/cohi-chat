package com.coDevs.cohiChat.global.config;

import java.time.Duration;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Profile("!local")
@RequiredArgsConstructor
public class RateLimitService implements RateLimitServiceBase {

    private static final String RATE_LIMIT_KEY_PREFIX = "rate-limit:";

    private final LettuceBasedProxyManager<String> proxyManager;
    private final RateLimitProperties properties;

    private volatile BucketConfiguration cachedConfiguration;

    @Override
    public long checkRateLimit(String key) {
        String bucketKey = RATE_LIMIT_KEY_PREFIX + key;

        BucketProxy bucket = proxyManager.builder()
            .build(bucketKey, this::getOrCreateBucketConfiguration);

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            return probe.getRemainingTokens();
        }

        log.warn("[rateLimit] [FAIL] scope={}", extractScope(key));
        throw new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED);
    }

    private BucketConfiguration getOrCreateBucketConfiguration() {
        if (cachedConfiguration == null) {
            cachedConfiguration = BucketConfiguration.builder()
                .addLimit(
                    Bandwidth.builder()
                        .capacity(properties.getCapacity())
                        .refillGreedy(
                            properties.getRefillTokens(),
                            Duration.ofSeconds(properties.getRefillDurationSeconds())
                        )
                        .build()
                )
                .build();
        }
        return cachedConfiguration;
    }

    private String extractScope(String key) {
        int separatorIndex = key.indexOf(':');
        if (separatorIndex < 0) {
            return "global";
        }
        return key.substring(0, separatorIndex);
    }
}
