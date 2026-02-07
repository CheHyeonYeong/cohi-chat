package com.coDevs.cohiChat.global.config;

import java.util.Set;

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
	private Set<String> trustedProxies = Set.of("127.0.0.1", "::1", "0:0:0:0:0:0:0:1");
}
