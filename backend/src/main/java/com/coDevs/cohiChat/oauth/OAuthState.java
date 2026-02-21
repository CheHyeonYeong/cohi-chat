package com.coDevs.cohiChat.oauth;

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
@RedisHash(value = "oauthState")
public class OAuthState {

	@Id
	private String state;

	@TimeToLive(unit = TimeUnit.SECONDS)
	private long expiration;

	@Builder
	private OAuthState(String state, long expiration) {
		this.state = state;
		this.expiration = expiration;
	}

	public static OAuthState create(String state) {
		return OAuthState.builder()
			.state(state)
			.expiration(600L) // 10분
			.build();
	}
}
