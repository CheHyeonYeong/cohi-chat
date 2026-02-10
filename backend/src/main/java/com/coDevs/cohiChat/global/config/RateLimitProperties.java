package com.coDevs.cohiChat.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

	@Min(1)
	private int capacity = 10;

	@Min(1)
	private int refillTokens = 10;

	@Min(1)
	private int refillDurationSeconds = 60;

	@Min(1)
	private int bucketTtlSeconds = 90;
}
