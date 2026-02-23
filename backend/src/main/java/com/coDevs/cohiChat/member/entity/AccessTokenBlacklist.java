package com.coDevs.cohiChat.member.entity;

import java.util.concurrent.TimeUnit;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RedisHash(value = "accessTokenBlacklist")
public class AccessTokenBlacklist {

	@Id
	private String tokenHash;

	@TimeToLive(unit = TimeUnit.SECONDS)
	private Long expirationSeconds;

	@Builder
	private AccessTokenBlacklist(String tokenHash, Long expirationSeconds) {
		this.tokenHash = tokenHash;
		this.expirationSeconds = expirationSeconds;
	}

	public static AccessTokenBlacklist create(String tokenHash, long expirationSeconds) {
		return AccessTokenBlacklist.builder()
			.tokenHash(tokenHash)
			.expirationSeconds(expirationSeconds)
			.build();
	}
}
