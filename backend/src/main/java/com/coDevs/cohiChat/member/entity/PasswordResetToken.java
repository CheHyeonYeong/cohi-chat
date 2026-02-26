package com.coDevs.cohiChat.member.entity;

import java.util.concurrent.TimeUnit;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RedisHash(value = "passwordResetToken")
public class PasswordResetToken {

	/** Redis key: email */
	@Id
	private String email;

	/** SHA-256 해시된 토큰 값 */
	@Indexed
	private String tokenHash;

	/** TTL: 30분 */
	@TimeToLive(unit = TimeUnit.MINUTES)
	private Long expirationMinutes;

	@Builder
	private PasswordResetToken(String email, String tokenHash, Long expirationMinutes) {
		this.email = email;
		this.tokenHash = tokenHash;
		this.expirationMinutes = expirationMinutes;
	}

	public static PasswordResetToken create(String email, String tokenHash) {
		return PasswordResetToken.builder()
			.email(email)
			.tokenHash(tokenHash)
			.expirationMinutes(30L)
			.build();
	}
}
