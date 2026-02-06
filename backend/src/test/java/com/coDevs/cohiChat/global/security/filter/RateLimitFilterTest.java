package com.coDevs.cohiChat.global.security.filter;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class RateLimitFilterTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private RedisConnectionFactory redisConnectionFactory;

	@BeforeEach
	void setUp() {
		redisConnectionFactory.getConnection().serverCommands().flushDb();
	}

	@Test
	@DisplayName("10회 요청 후 11번째에서 429 반환")
	void rateLimitExceeded() throws Exception {
		for (int i = 0; i < 10; i++) {
			mockMvc.perform(post("/members/v1/refresh")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"dummy-token\"}"))
				.andExpect(result ->
					assertNotEquals(429, result.getResponse().getStatus()));
		}

		mockMvc.perform(post("/members/v1/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\": \"dummy-token\"}"))
			.andExpect(status().isTooManyRequests())
			.andExpect(header().exists("Retry-After"))
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.error.code").value("RATE_LIMIT_EXCEEDED"));
	}

	@Test
	@DisplayName("X-Rate-Limit-Remaining 헤더 값 검증")
	void rateLimitRemainingHeader() throws Exception {
		mockMvc.perform(post("/members/v1/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\": \"dummy-token\"}"))
			.andExpect(header().string("X-Rate-Limit-Remaining", "9"));

		mockMvc.perform(post("/members/v1/refresh")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\": \"dummy-token\"}"))
			.andExpect(header().string("X-Rate-Limit-Remaining", "8"));
	}

	@Test
	@DisplayName("POST 외 요청은 rate limit 미적용")
	void nonPostRequestNotRateLimited() throws Exception {
		for (int i = 0; i < 15; i++) {
			mockMvc.perform(get("/members/v1/refresh"))
				.andExpect(result ->
					assertNotEquals(429, result.getResponse().getStatus()));
		}
	}

	@Test
	@DisplayName("다른 IP(X-Forwarded-For)는 별도 버킷 사용")
	void differentIpUsesSeparateBucket() throws Exception {
		// IP 1: 10회 소진
		for (int i = 0; i < 10; i++) {
			mockMvc.perform(post("/members/v1/refresh")
					.header("X-Forwarded-For", "192.168.1.100")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"dummy-token\"}"))
				.andExpect(result ->
					assertNotEquals(429, result.getResponse().getStatus()));
		}

		// IP 1: 11번째 → 429
		mockMvc.perform(post("/members/v1/refresh")
				.header("X-Forwarded-For", "192.168.1.100")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\": \"dummy-token\"}"))
			.andExpect(status().isTooManyRequests());

		// IP 2: 여전히 허용
		mockMvc.perform(post("/members/v1/refresh")
				.header("X-Forwarded-For", "192.168.1.200")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\": \"dummy-token\"}"))
			.andExpect(result ->
				assertNotEquals(429, result.getResponse().getStatus()));
	}
}
