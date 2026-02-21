package com.coDevs.cohiChat.oauth;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class OAuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private OAuthService oAuthService;

	@Test
	@DisplayName("GET /oauth/v1/{provider}/authorize - Authorization URL 반환")
	void getAuthorizationUrl() throws Exception {
		given(oAuthService.getAuthorizationUrl("google"))
			.willReturn("https://accounts.google.com/o/oauth2/v2/auth?client_id=test");

		mockMvc.perform(get("/oauth/v1/google/authorize"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.url").value("https://accounts.google.com/o/oauth2/v2/auth?client_id=test"));
	}

	@Test
	@DisplayName("POST /oauth/v1/{provider}/callback - 소셜 로그인 성공")
	void socialLoginCallback() throws Exception {
		LoginResponseDTO loginResponse = LoginResponseDTO.builder()
			.accessToken("test-access-token")
			.expiredInMinutes(60)
			.refreshToken("test-refresh-token")
			.username("google_123")
			.displayName("TestUser")
			.build();

		given(oAuthService.socialLogin("google", "test-auth-code", "test-state")).willReturn(loginResponse);

		mockMvc.perform(post("/oauth/v1/google/callback")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\": \"test-auth-code\", \"state\": \"test-state\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").value("test-access-token"))
			.andExpect(jsonPath("$.username").value("google_123"));
	}

	@Test
	@DisplayName("GET /oauth/v1/{provider}/authorize - 지원하지 않는 provider 시 400")
	void getAuthorizationUrl_unsupportedProvider() throws Exception {
		given(oAuthService.getAuthorizationUrl("github"))
			.willThrow(new CustomException(ErrorCode.INVALID_PROVIDER));

		mockMvc.perform(get("/oauth/v1/github/authorize"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.error.code").value("INVALID_PROVIDER"));
	}

	@Test
	@DisplayName("POST /oauth/v1/{provider}/callback - 빈 code 시 400")
	void socialLoginCallback_blankCode() throws Exception {
		mockMvc.perform(post("/oauth/v1/google/callback")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\": \"\", \"state\": \"test-state\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
	}

	@Test
	@DisplayName("POST /oauth/v1/{provider}/callback - state 누락 시 400")
	void socialLoginCallback_missingState() throws Exception {
		mockMvc.perform(post("/oauth/v1/google/callback")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\": \"test-auth-code\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	@DisplayName("POST /oauth/v1/{provider}/callback - 지원하지 않는 provider 시 400")
	void socialLoginCallback_unsupportedProvider() throws Exception {
		willThrow(new CustomException(ErrorCode.INVALID_PROVIDER))
			.given(oAuthService).socialLogin("github", "test-auth-code", "test-state");

		mockMvc.perform(post("/oauth/v1/github/callback")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\": \"test-auth-code\", \"state\": \"test-state\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.error.code").value("INVALID_PROVIDER"));
	}
}
