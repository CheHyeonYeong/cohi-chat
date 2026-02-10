package com.coDevs.cohiChat.global.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

@SpringBootTest
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class RateLimitServiceTest {

	@Autowired
	private RateLimitService rateLimitService;

	@Autowired
	private RedisConnectionFactory redisConnectionFactory;

	@BeforeEach
	void setUp() {
		var connection = redisConnectionFactory.getConnection();
		try {
			connection.serverCommands().flushDb();
		} finally {
			connection.close();
		}
	}

	@Test
	@DisplayName("정상 요청 시 남은 토큰 수 반환")
	void checkRateLimit_returnsRemaining() {
		long remaining = rateLimitService.checkRateLimit("refresh:testuser");
		assertThat(remaining).isEqualTo(9);
	}

	@Test
	@DisplayName("10회 초과 시 RATE_LIMIT_EXCEEDED 예외 발생")
	void checkRateLimit_throwsWhenExceeded() {
		for (int i = 0; i < 10; i++) {
			rateLimitService.checkRateLimit("refresh:testuser");
		}

		assertThatThrownBy(() -> rateLimitService.checkRateLimit("refresh:testuser"))
			.isInstanceOf(CustomException.class)
			.satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
				.isEqualTo(ErrorCode.RATE_LIMIT_EXCEEDED));
	}

	@Test
	@DisplayName("다른 키는 별도 버킷 사용")
	void checkRateLimit_separateBuckets() {
		for (int i = 0; i < 10; i++) {
			rateLimitService.checkRateLimit("refresh:user1");
		}

		assertThatThrownBy(() -> rateLimitService.checkRateLimit("refresh:user1"))
			.isInstanceOf(CustomException.class);

		long remaining = rateLimitService.checkRateLimit("refresh:user2");
		assertThat(remaining).isEqualTo(9);
	}
}
