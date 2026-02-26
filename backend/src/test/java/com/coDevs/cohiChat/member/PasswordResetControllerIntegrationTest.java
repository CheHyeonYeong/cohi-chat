package com.coDevs.cohiChat.member;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class PasswordResetControllerIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private PasswordResetService passwordResetService;

	@Nested
	@DisplayName("POST /auth/password-reset/request - 비밀번호 재설정 요청")
	class RequestPasswordResetTest {

		@Test
		@DisplayName("유효한 이메일 → 200 OK")
		void request_validEmail_returns200() throws Exception {
			doNothing().when(passwordResetService).requestPasswordReset(anyString());

			mockMvc.perform(post("/auth/password-reset/request")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"email\": \"user@test.com\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true));
		}

		@Test
		@DisplayName("이메일 형식 오류 → 400 Bad Request")
		void request_invalidEmail_returns400() throws Exception {
			mockMvc.perform(post("/auth/password-reset/request")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"email\": \"not-an-email\"}"))
				.andExpect(status().isBadRequest());
		}

		@Test
		@DisplayName("OAuth 계정 요청 → 400 Bad Request")
		void request_oauthAccount_returns400() throws Exception {
			doThrow(new CustomException(ErrorCode.PASSWORD_RESET_NOT_LOCAL))
				.when(passwordResetService).requestPasswordReset(anyString());

			mockMvc.perform(post("/auth/password-reset/request")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"email\": \"oauth@test.com\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("PASSWORD_RESET_NOT_LOCAL"));
		}
	}

	@Nested
	@DisplayName("POST /auth/password-reset/verify - 토큰 유효성 검증")
	class VerifyResetTokenTest {

		@Test
		@DisplayName("유효한 토큰 → 200 OK")
		void verify_validToken_returns200() throws Exception {
			doNothing().when(passwordResetService).verifyResetToken(anyString());

			mockMvc.perform(post("/auth/password-reset/verify")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"valid-token\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true));
		}

		@Test
		@DisplayName("유효하지 않은 토큰 → 400 Bad Request")
		void verify_invalidToken_returns400() throws Exception {
			doThrow(new CustomException(ErrorCode.INVALID_RESET_TOKEN))
				.when(passwordResetService).verifyResetToken(anyString());

			mockMvc.perform(post("/auth/password-reset/verify")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"invalid-token\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("INVALID_RESET_TOKEN"));
		}

		@Test
		@DisplayName("빈 토큰 → 400 Bad Request")
		void verify_blankToken_returns400() throws Exception {
			mockMvc.perform(post("/auth/password-reset/verify")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"\"}"))
				.andExpect(status().isBadRequest());
		}
	}

	@Nested
	@DisplayName("POST /auth/password-reset/confirm - 새 비밀번호 설정")
	class ConfirmPasswordResetTest {

		@Test
		@DisplayName("유효한 토큰 + 새 비밀번호 → 200 OK")
		void confirm_validRequest_returns200() throws Exception {
			doNothing().when(passwordResetService).confirmPasswordReset(anyString(), anyString());

			mockMvc.perform(post("/auth/password-reset/confirm")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"valid-token\", \"newPassword\": \"newPw1234!\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true));
		}

		@Test
		@DisplayName("유효하지 않은 토큰 → 400 Bad Request")
		void confirm_invalidToken_returns400() throws Exception {
			doThrow(new CustomException(ErrorCode.INVALID_RESET_TOKEN))
				.when(passwordResetService).confirmPasswordReset(anyString(), anyString());

			mockMvc.perform(post("/auth/password-reset/confirm")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"bad-token\", \"newPassword\": \"newPw1234!\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.error.code").value("INVALID_RESET_TOKEN"));
		}

		@Test
		@DisplayName("비밀번호 8자 미만 → 400 Bad Request")
		void confirm_shortPassword_returns400() throws Exception {
			mockMvc.perform(post("/auth/password-reset/confirm")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"token\": \"valid-token\", \"newPassword\": \"short\"}"))
				.andExpect(status().isBadRequest());
		}
	}
}
