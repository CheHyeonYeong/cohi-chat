package com.coDevs.cohiChat.global.config;

import java.time.Duration;

import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RateLimitService {

	private static final String RATE_LIMIT_KEY_PREFIX = "rate-limit:";

	private final LettuceBasedProxyManager<String> proxyManager;
	private final RateLimitProperties properties;

	private volatile BucketConfiguration cachedConfiguration;

	public long checkRateLimit(String key) {
		String bucketKey = RATE_LIMIT_KEY_PREFIX + key;

		BucketProxy bucket = proxyManager.builder()
			.build(bucketKey, this::getOrCreateBucketConfiguration);

		ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

		if (probe.isConsumed()) {
			return probe.getRemainingTokens();
		}

		throw new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED);
	}

	private BucketConfiguration getOrCreateBucketConfiguration() {
		if (cachedConfiguration == null) {
			cachedConfiguration = BucketConfiguration.builder()
				.addLimit(
					Bandwidth.builder()
						.capacity(properties.getCapacity())
						.refillGreedy(properties.getRefillTokens(),
							Duration.ofSeconds(properties.getRefillDurationSeconds()))
						.build()
				)
				.build();
		}
		return cachedConfiguration;
	}
}
