package com.coDevs.cohiChat.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

	private int capacity = 10;
	private int refillTokens = 10;
	private int refillDurationSeconds = 60;
	private int bucketTtlSeconds = 90;
}
